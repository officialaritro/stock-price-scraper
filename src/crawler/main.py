"""
StockSpy Crawler
Fetches stock quotes from NSE India API and publishes to Kafka.
"""

import os
import json
import logging
import signal
import sys
from datetime import datetime
from typing import Optional

import pytz
from kafka import KafkaProducer
from kafka.errors import KafkaError
from nse import NSE

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class StockCrawler:
    def __init__(
        self,
        bootstrap_servers: str,
        topic: str,
        download_dir: str = '/tmp/nse_cache'
    ):
        self.bootstrap_servers = bootstrap_servers
        self.topic = topic
        self.nse = NSE(download_dir)
        self.producer: Optional[KafkaProducer] = None
        self.running = True

    def _create_producer(self) -> KafkaProducer:
        """Create Kafka producer with reliable settings."""
        return KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            acks='all',
            retries=3,
            compression_type='gzip',
            batch_size=16384,
            linger_ms=10,
            buffer_memory=33554432,
            max_in_flight_requests_per_connection=5,
            request_timeout_ms=30000,
            max_block_ms=60000,
        )

    def _fetch_quote(self, symbol: str) -> Optional[dict]:
        """Fetch quote for a single symbol."""
        try:
            quote = self.nse.equityQuote(symbol)
            if not quote:
                logger.warning(f"No quote returned for {symbol}")
                return None

            return {
                'symbol': symbol,
                'timestamp': datetime.now(pytz.UTC).isoformat(),
                'open': float(quote.get('open', 0)),
                'high': float(quote.get('dayHigh', 0)),
                'low': float(quote.get('dayLow', 0)),
                'close': float(quote.get('lastPrice', 0)),
                'volume': int(quote.get('totalMarketVolume', 0)),
                'source': 'nse',
                'fetched_at': datetime.now(pytz.UTC).isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to fetch quote for {symbol}: {e}")
            return None

    def _is_valid_tick(self, tick: dict) -> bool:
        """Validate tick data per SPEC.md data quality rules."""
        if not tick:
            return False

        price_fields = ['open', 'high', 'low', 'close']
        for field in price_fields:
            if field not in tick or tick[field] is None:
                logger.warning(f"Missing price field: {field}")
                return False

            value = tick[field]
            if not isinstance(value, (int, float)) or value <= 0 or value > 100000:
                logger.warning(f"Invalid price {field}: {value}")
                return False

        if tick.get('volume', 0) == 0:
            logger.warning(f"Zero volume - market likely closed")
            return False

        return True

    def _publish_to_kafka(self, tick: dict) -> bool:
        """Publish validated tick to Kafka."""
        try:
            future = self.producer.send(
                self.topic,
                key=tick['symbol'],
                value=tick,
                timestamp=int(datetime.now(pytz.UTC).timestamp() * 1000)
            )
            record_metadata = future.get(timeout=10)
            logger.info(
                f"Published {tick['symbol']} to {record_metadata.topic}:"
                f"partition {record_metadata.partition}:offset {record_metadata.offset}"
            )
            return True
        except KafkaError as e:
            logger.error(f"Kafka error publishing {tick['symbol']}: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error publishing {tick['symbol']}: {e}")
            return False

    def crawl_symbols(self, symbols: list[str]) -> dict:
        """Crawl multiple symbols and publish to Kafka."""
        results = {'success': 0, 'failed': 0, 'skipped': 0}

        for symbol in symbols:
            if not self.running:
                break

            tick = self._fetch_quote(symbol)
            if not tick:
                results['failed'] += 1
                continue

            if not self._is_valid_tick(tick):
                results['skipped'] += 1
                continue

            if self._publish_to_kafka(tick):
                results['success'] += 1
            else:
                results['failed'] += 1

        return results

    def start(self, symbols: list[str]):
        """Start crawling loop."""
        logger.info(f"Starting crawler for symbols: {symbols}")

        try:
            self.producer = self._create_producer()
            logger.info(f"Kafka producer connected to {self.bootstrap_servers}")
        except Exception as e:
            logger.error(f"Failed to create Kafka producer: {e}")
            sys.exit(1)

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        results = self.crawl_symbols(symbols)
        logger.info(f"Crawl complete: {results}")

    def shutdown(self):
        """Clean shutdown."""
        if self.producer:
            self.producer.flush()
            self.producer.close()
            logger.info("Kafka producer closed")


def main():
    """Main entry point."""
    bootstrap_servers = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'kafka:29092')
    topic = os.getenv('KAFKA_TOPIC', 'raw_ticks')
    download_dir = os.getenv('NSE_DOWNLOAD_DIR', '/tmp/nse_cache')

    symbols_env = os.getenv('CRAWL_SYMBOLS', 'RELIANCE,TCS,HDFCBANK,INFY,ICICIBANK,SBIN,ITC,HINDUNILVR')
    symbols = [s.strip() for s in symbols_env.split(',')]

    crawler = StockCrawler(
        bootstrap_servers=bootstrap_servers,
        topic=topic,
        download_dir=download_dir
    )

    try:
        crawler.start(symbols)
    finally:
        crawler.shutdown()


if __name__ == '__main__':
    main()