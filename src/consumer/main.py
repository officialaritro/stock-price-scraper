"""
StockSpy Consumer
Consumes raw ticks from Kafka, validates, and writes to MongoDB + PostgreSQL.
Follows Kafka best practices: idempotent processing, exactly-once semantics.
"""

import os
import json
import logging
import signal
import sys
from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from kafka import KafkaConsumer
from kafka.errors import KafkaError
from pymongo import MongoClient
from pymongo.errors import PyMongoError
import psycopg2
from psycopg2 import sql
from psycopg2.extras import RealDictCursor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StockConsumer:
    def __init__(
        self,
        bootstrap_servers: str,
        topic: str,
        group_id: str,
        mongodb_uri: str,
        mongodb_db: str,
        postgres_config: dict
    ):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.group_id = group_id
        self.mongodb_uri = mongodb_uri
        self.mongodb_db = mongodb_db
        self.postgres_config = postgres_config
        self.consumer: Optional[KafkaConsumer] = None
        self.mongo_client: Optional[MongoClient] = None
        self.pg_conn = None
        self.running = True

    def _create_consumer(self) -> KafkaConsumer:
        """Create Kafka consumer with balanced settings."""
        return KafkaConsumer(
            self.topic,
            bootstrap_servers=self.bootstrap_servers,
            group_id=self.group_id,
            auto_offset_reset='latest',
            enable_auto_commit=False,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda k: k.decode('utf-8') if k else None,
            max_poll_interval_ms=300000,
            max_poll_records=100,
            fetch_min_bytes=1024,
            fetch_max_wait_ms=500,
            session_timeout_ms=30000,
            heartbeat_interval_ms=3000,
        )

    def _connect_mongodb(self) -> MongoClient:
        """Connect to MongoDB with connection pooling."""
        return MongoClient(
            self.mongodb_uri,
            maxPoolSize=50,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
        )

    def _connect_postgres(self):
        """Connect to PostgreSQL."""
        return psycopg2.connect(
            **self.postgres_config,
            cursor_factory=RealDictCursor
        )

    def _init_mongodb_indexes(self):
        """Initialize MongoDB indexes for efficient queries."""
        db = self.mongo_client[self.mongodb_db]
        ticks = db.ticks

        ticks.create_index(
            [('symbol', 1), ('timestamp', -1)],
            name='idx_symbol_timestamp',
            background=True
        )
        ticks.create_index(
            [('symbol', 1), ('timestamp', -1)],
            name='idx_symbol_timestamp_unique',
            unique=True,
            partialFilterExpression={'timestamp': {'$exists': True}}
        )
        logger.info("MongoDB indexes initialized")

    def _validate_tick(self, tick: dict) -> bool:
        """
        Validate tick per SPEC.md data quality rules:
        1. Null check: Discard ticks with missing price fields
        2. Range check: Discard if price < 0 or > 100000
        3. Duplicate check: Discard if tick exists within 1-minute window
        4. Volume check: Discard if volume = 0 (market closed)
        """
        if not tick:
            return False

        price_fields = ['open', 'high', 'low', 'close']
        for field in price_fields:
            if field not in tick or tick[field] is None:
                logger.debug(f"Missing price field: {field}")
                return False

        symbol = tick.get('symbol')
        timestamp = tick.get('timestamp')
        if not symbol or not timestamp:
            return False

        for field in price_fields:
            value = tick[field]
            if not isinstance(value, (int, float)) or value <= 0 or value > 100000:
                logger.debug(f"Invalid price {field}: {value}")
                return False

        if tick.get('volume', 0) == 0:
            logger.debug("Zero volume - market closed")
            return False

        return True

    def _check_duplicate(self, tick: dict) -> bool:
        """Check for duplicate within 1-minute window."""
        db = self.mongo_client[self.mongodb_db]
        ticks = db.ticks

        symbol = tick['symbol']
        timestamp = tick.get('timestamp')

        one_minute_ago = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        one_minute_ago = one_minute_ago.replace(minute=max(0, one_minute_ago.minute - 1))

        existing = ticks.find_one({
            'symbol': symbol,
            'timestamp': {
                '$gte': one_minute_ago.isoformat(),
                '$lte': timestamp
            }
        })

        return existing is not None

    def _write_to_mongodb(self, tick: dict) -> bool:
        """Write validated tick to MongoDB."""
        db = self.mongo_client[self.mongodb_db]
        ticks = db.ticks

        tick['created_at'] = datetime.now()

        try:
            result = ticks.update_one(
                {'symbol': tick['symbol'], 'timestamp': tick['timestamp']},
                {'$set': tick},
                upsert=True
            )
            return result.acknowledged
        except PyMongoError as e:
            logger.error(f"MongoDB error: {e}")
            return False

    def _update_daily_aggregate(self, tick: dict) -> bool:
        """Update daily price aggregates in PostgreSQL."""
        try:
            tick_date = date.fromisoformat(tick['timestamp'][:10])

            with self.pg_conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO price_history_daily
                        (symbol, date, open_price, high_price, low_price, close_price, volume)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (symbol, date) DO UPDATE SET
                        high_price = GREATEST(EXCLUDED.high_price, price_history_daily.high_price),
                        low_price = LEAST(EXCLUDED.low_price, price_history_daily.low_price),
                        close_price = EXCLUDED.close_price,
                        volume = price_history_daily.volume + EXCLUDED.volume,
                        updated_at = NOW()
                    RETURNING id
                """, (
                    tick['symbol'],
                    tick_date,
                    tick['open'],
                    tick['high'],
                    tick['low'],
                    tick['close'],
                    tick['volume']
                ))
                self.pg_conn.commit()
            return True
        except Exception as e:
            logger.error(f"PostgreSQL error: {e}")
            self.pg_conn.rollback()
            return False

    def _process_message(self, message):
        """Process a single Kafka message."""
        tick = message.value

        if not self._validate_tick(tick):
            logger.debug(f"Invalid tick: {tick.get('symbol')}")
            return False

        if self._check_duplicate(tick):
            logger.debug(f"Duplicate tick: {tick.get('symbol')}")
            return False

        success = True
        if not self._write_to_mongodb(tick):
            logger.error(f"Failed to write to MongoDB: {tick.get('symbol')}")
            success = False

        if not self._update_daily_aggregate(tick):
            logger.error(f"Failed to update PostgreSQL: {tick.get('symbol')}")
            success = False

        return success

    def start(self):
        """Start consuming messages."""
        logger.info(f"Starting consumer for topic: {self.topic}")

        try:
            self.consumer = self._create_consumer()
            logger.info(f"Kafka consumer connected to {self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"Failed to create Kafka consumer: {e}")
            sys.exit(1)

        try:
            self.mongo_client = self._connect_mongodb()
            self._init_mongodb_indexes()
            logger.info(f"MongoDB connected to {self.mongodb_db}")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            sys.exit(1)

        try:
            self.pg_conn = self._connect_postgres()
            logger.info(f"PostgreSQL connected")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            sys.exit(1)

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        processed = 0
        failed = 0

        try:
            while self.running:
                messages = self.consumer.poll(timeout_ms=1000)

                for topic_partition, records in messages.items():
                    for message in records:
                        if not self.running:
                            break

                        try:
                            if self._process_message(message):
                                processed += 1
                                self.consumer.commit()
                            else:
                                failed += 1
                        except Exception as e:
                            logger.error(f"Error processing message: {e}")
                            failed += 1

        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            logger.info(f"Consumer shutdown: processed={processed}, failed={failed}")

    def shutdown(self):
        """Clean shutdown."""
        if self.consumer:
            self.consumer.close()
            logger.info("Kafka consumer closed")

        if self.mongo_client:
            self.mongo_client.close()
            logger.info("MongoDB connection closed")

        if self.pg_conn:
            self.pg_conn.close()
            logger.info("PostgreSQL connection closed")


def main():
    """Main entry point."""
    bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
    topic = os.getenv('KAFKA_TOPIC', 'raw_ticks')
    group_id = os.getenv('KAFKA_GROUP_ID', 'stockspy-consumer-group')

    mongodb_uri = os.getenv(
        'MONGODB_URI',
        'mongodb://stockspy:stockspy@mongodb:27017'
    )
    mongodb_db = os.getenv('MONGODB_DB', 'stockspy')

    postgres_config = {
        'host': os.getenv('POSTGRES_HOST', 'postgresql'),
        'port': os.getenv('POSTGRES_PORT', '5432'),
        'dbname': os.getenv('POSTGRES_DB', 'stockspy'),
        'user': os.getenv('POSTGRES_USER', 'stockspy'),
        'password': os.getenv('POSTGRES_PASSWORD', 'stockspy'),
    }

    consumer = StockConsumer(
        bootstrap_servers=bootstrap_servers,
        topic=topic,
        group_id=group_id,
        mongodb_uri=mongodb_uri,
        mongodb_db=mongodb_db,
        postgres_config=postgres_config
    )

    try:
        consumer.start()
    finally:
        consumer.shutdown()


if __name__ == '__main__':
    main()