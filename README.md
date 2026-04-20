# StockSpy 📈

Stock Price Crawler & Market Alert System

## Overview

StockSpy crawls NSE India stock prices, streams data through Kafka, stores in MongoDB + PostgreSQL, and sends Telegram alerts on price/volume movements.

## Architecture

```
[NSE API] → [Kafka] → [Consumer] → [MongoDB] + [PostgreSQL] → [Telegram Alerts]
```

## Quick Start

### 1. Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Telegram Bot Token (via @BotFather)

### 2. Setup

```bash
# Copy environment file
cp .env.example .env

# Edit .env with your Telegram credentials
# TELEGRAM_BOT_TOKEN=your_bot_token
# TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Start Services

```bash
# Start core services (Kafka, MongoDB, PostgreSQL)
docker-compose up -d

# Wait for services to be ready
sleep 15

# Initialize PostgreSQL schema
docker exec -i stockspy-postgresql psql -U stockspy -d stockspy < src/consumer/init_db.sql

# Start consumer (optional for alerts)
docker-compose up -d consumer
```

### 4. Run Crawler

```bash
# Run crawler manually
python src/crawler/main.py

# Or set up cron for automatic runs
# */15 * * * * cd /path/to/project && python src/crawler/main.py
```

## Usage

### CLI Commands

```bash
# List watchlist
python src/cli/main.py list

# Add stock to watchlist
python src/cli/main.py add RELIANCE --name "Reliance Industries"

# Set alert
python src/cli/main.py set-alert RELIANCE --type price_drop --threshold 2.0

# Get price
python src/cli/main.py price RELIANCE
```

### Telegram Bot Commands

- `/start` - Start the bot
- `/prices` - Show current prices
- `/alerts` - Show alert configurations
- `/add SYMBOL` - Add stock to watchlist
- `/remove SYMBOL` - Remove from watchlist

## Database Schema

### PostgreSQL (Metadata)

- **watchlist** - Stocks being tracked
- **alerts** - Alert configurations
- **price_history_daily** - Daily OHLCV aggregates

### MongoDB (Raw Data)

- **ticks** - Raw OHLCV tick data

## Services

| Service | Description | Required |
|---------|-------------|----------|
| Kafka | Message queue for raw ticks | Yes |
| MongoDB | Raw tick storage | Yes |
| PostgreSQL | Watchlist, alerts, metadata | Yes |
| Consumer | Validates & processes ticks | Yes |
| Alert Bot | Telegram alerts | Optional |

## Environment Variables

| Variable | Default | Description |
|----------|---------|------------|
| KAFKA_BOOTSTRAP_SERVERS | kafka:29092 | Kafka server |
| KAFKA_TOPIC | raw_ticks | Kafka topic |
| MONGODB_URI | mongodb://stockspy:stockspy@mongodb:27017 | MongoDB URI |
| POSTGRES_HOST | postgresql | PostgreSQL host |
| TELEGRAM_BOT_TOKEN | - | Telegram bot token |
| TELEGRAM_CHAT_ID | - | Telegram chat ID |

## Development

### Running Tests

```bash
# TBD
```

### Making Changes

1. Make changes to source files
2. Rebuild affected services:
   ```bash
   docker-compose build consumer
   docker-compose up -d consumer
   ```

## License

MIT