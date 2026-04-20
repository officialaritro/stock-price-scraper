"""
StockSpy Alert Engine
Monitors price/volume changes and sends Telegram alerts.
"""

import os
import logging
import signal
from datetime import datetime, timedelta
from typing import Optional

from pymongo import MongoClient
import psycopg2
from psycopg2.extras import RealDictCursor
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class AlertEngine:
    def __init__(
        self,
        bot_token: str,
        chat_id: str,
        mongodb_uri: str,
        mongodb_db: str,
        postgres_config: dict
    ):
        self.bot_token = bot_token
        self.chat_id = chat_id
        self.mongodb_uri = mongodb_uri
        self.mongodb_db = mongodb_db
        self.postgres_config = postgres_config
        self.mongo_client: Optional[MongoClient] = None
        self.pg_conn = None
        self.running = True
        self.app = None

    def _connect_mongodb(self) -> MongoClient:
        return MongoClient(
            self.mongodb_uri,
            maxPoolSize=50,
            serverSelectionTimeoutMS=5000,
        )

    def _connect_postgres(self):
        return psycopg2.connect(
            **self.postgres_config,
            cursor_factory=RealDictCursor
        )

    def _get_latest_price(self, symbol: str) -> Optional[float]:
        """Get the latest close price for a symbol."""
        db = self.mongo_client[self.mongodb_db]
        latest = db.ticks.find_one(
            {'symbol': symbol},
            sort=[('timestamp', -1)]
        )
        return latest['close'] if latest else None

    def _get_previous_close(self, symbol: str, days_ago: int = 1) -> Optional[float]:
        """Get close price from N days ago."""
        db = self.mongo_client[self.mongodb_db]
        target_date = datetime.now() - timedelta(days=days_ago + 1)

        old = db.ticks.find_one(
            {'symbol': symbol, 'timestamp': {'$lte': target_date.isoformat()}},
            sort=[('timestamp', -1)]
        )
        return old['close'] if old else None

    def _get_average_volume(self, symbol: str, days: int = 30) -> Optional[int]:
        """Get average volume over N days."""
        db = self.mongo_client[self.mongodb_db]

        pipeline = [
            {'$match': {'symbol': symbol}},
            {'$sort': {'timestamp': -1}},
            {'$limit': days},
            {'$group': {
                '_id': None,
                'avg_volume': {'$avg': '$volume'}
            }}
        ]

        result = list(db.ticks.aggregate(pipeline))
        return int(result[0]['avg_volume']) if result else None

    def _get_alerts(self, symbol: str) -> list:
        """Get active alerts for a symbol."""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, symbol, alert_type, threshold_percent
                FROM alerts
                WHERE symbol = %s AND enabled = TRUE
            """, (symbol,))
            return cursor.fetchall()

    def _check_price_alert(self, symbol: str, alert_type: str, threshold: float) -> Optional[str]:
        """Check price alert condition."""
        current_price = self._get_latest_price(symbol)
        if not current_price:
            return None

        prev_price = self._get_previous_close(symbol)
        if not prev_price or prev_price == 0:
            return None

        change_pct = ((current_price - prev_price) / prev_price) * 100

        if alert_type == 'price_drop' and change_pct < -threshold:
            return f"📉 {symbol} dropped {abs(change_pct):.2f}% (₹{prev_price:.2f} → ₹{current_price:.2f})"
        elif alert_type == 'price_rise' and change_pct > threshold:
            return f"📈 {symbol} rose {change_pct:.2f}% (₹{prev_price:.2f} → ₹{current_price:.2f})"

        return None

    def _check_volume_alert(self, symbol: str, threshold: float) -> Optional[str]:
        """Check volume spike alert."""
        current_price = self._get_latest_price(symbol)
        if not current_price:
            return None

        db = self.mongo_client[self.mongodb_db]
        latest = db.ticks.find_one(
            {'symbol': symbol},
            sort=[('timestamp', -1)]
        )
        if not latest:
            return None

        current_volume = latest['volume']
        avg_volume = self._get_average_volume(symbol)

        if avg_volume and avg_volume > 0:
            volume_change = ((current_volume - avg_volume) / avg_volume) * 100
            if volume_change > threshold:
                return f"🔥 {symbol} volume spike {volume_change:.2f}% (avg: {avg_volume:,} → {current_volume:,})"

        return None

    def _should_send_alert(self, alert_id: int) -> bool:
        """Check if enough time has passed since last alert."""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                SELECT triggered_at FROM alerts
                WHERE id = %s
            """, (alert_id,))
            row = cursor.fetchone()

            if not row or not row['triggered_at']:
                return True

            triggered_at = row['triggered_at']
            hours_since = (datetime.now() - triggered_at).total_seconds() / 3600
            return hours_since >= 1

    def _mark_alert_triggered(self, alert_id: int):
        """Mark alert as triggered."""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                UPDATE alerts
                SET triggered_at = NOW()
                WHERE id = %s
            """, (alert_id,))
            self.pg_conn.commit()

    def _send_telegram_message(self, message: str):
        """Send message to Telegram."""
        if self.app:
            import asyncio
            asyncio.create_task(
                self.app.bot.send_message(
                    chat_id=self.chat_id,
                    text=message
                )
            )

    async def _start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command."""
        await update.message.reply_text(
            "📈 StockSpy Alert System\n\n"
            "Available commands:\n"
            "/prices - Show current prices\n"
            "/alerts - Show active alerts\n"
            "/add SYMBOL - Add stock to watchlist\n"
            "/remove SYMBOL - Remove from watchlist"
        )

    async def _prices_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /prices command."""
        db = self.mongo_client[self.mongodb_db]

        symbols = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'SBIN', 'ITC', 'HINDUNILVR']

        lines = ["📊 Current Prices:\n"]
        for symbol in symbols:
            latest = db.ticks.find_one(
                {'symbol': symbol},
                sort=[('timestamp', -1)]
            )
            if latest:
                lines.append(f"{symbol}: ₹{latest['close']:.2f}")
            else:
                lines.append(f"{symbol}: N/A")

        await update.message.reply_text("\n".join(lines))

    async def _alerts_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /alerts command."""
        with self.pg_conn.cursor() as cursor:
            cursor.execute("""
                SELECT symbol, alert_type, threshold_percent, enabled
                FROM alerts
                ORDER BY symbol
            """)
            rows = cursor.fetchall()

        lines = ["🔔 Alert Configurations:\n"]
        for row in rows:
            status = "✅" if row['enabled'] else "❌"
            lines.append(
                f"{status} {row['symbol']}: {row['alert_type']} @ {row['threshold_percent']}%"
            )

        await update.message.reply_text("\n".join(lines))

    async def _add_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /add command."""
        if not context.args:
            await update.message.reply_text("Usage: /add SYMBOL")
            return

        symbol = context.args[0].upper()

        with self.pg_conn.cursor() as cursor:
            try:
                cursor.execute("""
                    INSERT INTO watchlist (symbol, name)
                    VALUES (%s, %s)
                    ON CONFLICT (symbol) DO NOTHING
                """, (symbol, f"{symbol} (added by user)"))
                self.pg_conn.commit()
                await update.message.reply_text(f"✅ Added {symbol} to watchlist")
            except Exception as e:
                await update.message.reply_text(f"❌ Error: {e}")

    async def _remove_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /remove command."""
        if not context.args:
            await update.message.reply_text("Usage: /remove SYMBOL")
            return

        symbol = context.args[0].upper()

        with self.pg_conn.cursor() as cursor:
            try:
                cursor.execute("""
                    DELETE FROM watchlist WHERE symbol = %s
                """, (symbol,))
                self.pg_conn.commit()
                await update.message.reply_text(f"✅ Removed {symbol} from watchlist")
            except Exception as e:
                await update.message.reply_text(f"❌ Error: {e}")

    def start(self):
        """Start alert engine."""
        logger.info("Starting alert engine")

        try:
            self.mongo_client = self._connect_mongodb()
            logger.info("MongoDB connected")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return

        try:
            self.pg_conn = self._connect_postgres()
            logger.info("PostgreSQL connected")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return

        async def run_bot():
            self.app = Application.builder().token(self.bot_token).build()

            self.app.add_handler(CommandHandler("start", self._start_command))
            self.app.add_handler(CommandHandler("prices", self._prices_command))
            self.app.add_handler(CommandHandler("alerts", self._alerts_command))
            self.app.add_handler(CommandHandler("add", self._add_command))
            self.app.add_handler(CommandHandler("remove", self._remove_command))

            await self.app.run_polling(allowed_updates=UpdateTypes.ALL)

        def signal_handler(signum, frame):
            logger.info("Received shutdown signal")
            self.running = False

        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)

        import asyncio
        asyncio.run(run_bot())

    def shutdown(self):
        """Clean shutdown."""
        if self.mongo_client:
            self.mongo_client.close()
        if self.pg_conn:
            self.pg_conn.close()
        logger.info("Alert engine shutdown")


def main():
    """Main entry point."""
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')

    if not bot_token or not chat_id:
        logger.error("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID required")
        return

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

    engine = AlertEngine(
        bot_token=bot_token,
        chat_id=chat_id,
        mongodb_uri=mongodb_uri,
        mongodb_db=mongodb_db,
        postgres_config=postgres_config
    )

    engine.start()


if __name__ == '__main__':
    main()