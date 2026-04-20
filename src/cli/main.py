"""
StockSpy CLI
Command-line interface for managing watchlist and alerts.
"""

import os
import sys
import logging
import argparse
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_postgres_connection():
    """Create PostgreSQL connection."""
    return psycopg2.connect(
        host=os.getenv('POSTGRES_HOST', 'localhost'),
        port=os.getenv('POSTGRES_PORT', '5432'),
        dbname=os.getenv('POSTGRES_DB', 'stockspy'),
        user=os.getenv('POSTGRES_USER', 'stockspy'),
        password=os.getenv('POSTGRES_PASSWORD', 'stockspy'),
        cursor_factory=RealDictCursor
    )


def list_stocks():
    """List all stocks in watchlist."""
    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT symbol, name, added_at, active
            FROM watchlist
            ORDER BY added_at DESC
        """)
        rows = cursor.fetchall()

    if not rows:
        print("No stocks in watchlist")
        return

    print("📋 Watchlist:\n")
    for row in rows:
        status = "✅" if row['active'] else "❌"
        print(f"  {status} {row['symbol']:12} - {row['name']}")
        print(f"      Added: {row['added_at']}")
    print(f"\nTotal: {len(rows)} stocks")


def add_stock(symbol: str, name: Optional[str] = None):
    """Add stock to watchlist."""
    symbol = symbol.upper()
    name = name or f"{symbol} (user added)"

    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO watchlist (symbol, name)
            VALUES (%s, %s)
            ON CONFLICT (symbol) DO UPDATE SET name = EXCLUDED.name
            RETURNING symbol
        """, (symbol, name))
        conn.commit()
        result = cursor.fetchone()

    print(f"✅ Added {symbol} to watchlist")


def remove_stock(symbol: str):
    """Remove stock from watchlist."""
    symbol = symbol.upper()

    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            DELETE FROM watchlist
            WHERE symbol = %s
            RETURNING symbol
        """, (symbol,))
        conn.commit()
        result = cursor.fetchone()

    if result:
        print(f"✅ Removed {symbol} from watchlist")
    else:
        print(f"⚠️ {symbol} not in watchlist")


def list_alerts():
    """List all alert configurations."""
    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT symbol, alert_type, threshold_percent, enabled, triggered_at
            FROM alerts
            ORDER BY symbol, alert_type
        """)
        rows = cursor.fetchall()

    if not rows:
        print("No alerts configured")
        return

    print("🔔 Alert Configurations:\n")
    for row in rows:
        status = "✅" if row['enabled'] else "❌"
        print(f"  {status} {row['symbol']}: {row['alert_type']} @ {row['threshold_percent']}%")
        if row['triggered_at']:
            print(f"      Last triggered: {row['triggered_at']}")
    print(f"\nTotal: {len(rows)} alerts")


def set_alert(symbol: str, alert_type: str, threshold: float):
    """Set alert for a stock."""
    symbol = symbol.upper()

    if alert_type not in ['price_drop', 'price_rise', 'volume_spike']:
        print(f"⚠️ Invalid alert type. Use: price_drop, price_rise, volume_spike")
        return

    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO alerts (symbol, alert_type, threshold_percent)
            VALUES (%s, %s, %s)
            ON CONFLICT (symbol, alert_type) DO UPDATE SET
                threshold_percent = EXCLUDED.threshold_percent,
                enabled = TRUE
            RETURNING id
        """, (symbol, alert_type, threshold))
        conn.commit()
        result = cursor.fetchone()

    print(f"✅ Set {alert_type} alert for {symbol} at {threshold}%")


def remove_alert(symbol: str, alert_type: str):
    """Remove alert for a stock."""
    symbol = symbol.upper()

    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            DELETE FROM alerts
            WHERE symbol = %s AND alert_type = %s
            RETURNING id
        """, (symbol, alert_type))
        conn.commit()
        result = cursor.fetchone()

    if result:
        print(f"✅ Removed {alert_type} alert for {symbol}")
    else:
        print(f"⚠️ No {alert_type} alert found for {symbol}")


def get_price(symbol: str):
    """Get current price for a stock."""
    import psycopg2
    from psycopg2.extras import RealDictCursor

    conn = get_postgres_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT symbol, close_price, date
            FROM price_history_daily
            WHERE symbol = %s
            ORDER BY date DESC
            LIMIT 1
        """, (symbol.upper(),))
        result = cursor.fetchone()

    if result:
        print(f"📊 {result['symbol']}: ₹{result['close_price']:.2f} (as of {result['date']})")
    else:
        print(f"⚠️ No price data for {symbol}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='StockSpy CLI - Manage watchlist and alerts'
    )
    subparsers = parser.add_subparsers(dest='command', help='Command to run')

    subparsers.add_parser('list', help='List watchlist stocks')
    subparsers.add_parser('alerts', help='List alert configurations')

    add_parser = subparsers.add_parser('add', help='Add stock to watchlist')
    add_parser.add_argument('symbol', help='Stock symbol')
    add_parser.add_argument('--name', help='Stock name')

    remove_parser = subparsers.add_parser('remove', help='Remove stock from watchlist')
    remove_parser.add_argument('symbol', help='Stock symbol')

    alert_parser = subparsers.add_parser('set-alert', help='Set alert threshold')
    alert_parser.add_argument('symbol', help='Stock symbol')
    alert_parser.add_argument('--type', dest='alert_type', required=True,
                         choices=['price_drop', 'price_rise', 'volume_spike'])
    alert_parser.add_argument('--threshold', type=float, required=True)

    remove_alert_parser = subparsers.add_parser('remove-alert', help='Remove alert')
    remove_alert_parser.add_argument('symbol', help='Stock symbol')
    remove_alert_parser.add_argument('--type', dest='alert_type', required=True,
                                  choices=['price_drop', 'price_rise', 'volume_spike'])

    price_parser = subparsers.add_parser('price', help='Get stock price')
    price_parser.add_argument('symbol', help='Stock symbol')

    args = parser.parse_args()

    if not args.command or args.command == 'list':
        list_stocks()
    elif args.command == 'alerts':
        list_alerts()
    elif args.command == 'add':
        add_stock(args.symbol, args.name)
    elif args.command == 'remove':
        remove_stock(args.symbol)
    elif args.command == 'set-alert':
        set_alert(args.symbol, args.alert_type, args.threshold)
    elif args.command == 'remove-alert':
        remove_alert(args.symbol, args.alert_type)
    elif args.command == 'price':
        get_price(args.symbol)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()