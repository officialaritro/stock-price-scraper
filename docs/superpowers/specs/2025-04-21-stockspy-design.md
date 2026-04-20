# StockSpy — Stock Price Crawler & Market Alert System

## Project Overview

**Project Name:** StockSpy
**Type:** Data Engineering / Real-time Streaming Pipeline
**Core Functionality:** Crawls NSE India stock prices, streams via Kafka, stores in MongoDB + PostgreSQL, triggers Telegram alerts on price/volume movements
**Target Users:** Individual investors wanting portfolio alerts

---

## Architecture

```
┌─────────────────┐     ┌─────────────┐     ┌──────────────────┐
│   NSE API        │     │   Kafka     │     │  Consumer        │
│   (nse-python)   │────▶│  (raw_ticks)│────▶│  Validator      │
└─────────────────┘     └─────────────┘     └────────┬─────────┘
                                                    │
                                        ┌───────────┴───────────┐
                                        ▼                   ▼
                                  ┌────────────┐    ┌─────────────┐
                                  │  MongoDB  │    │ PostgreSQL │
                                  │ (raw OHLCV)│   │ (metadata) │
                                  └────────────┘    └──────┬──────┘
                                                           ▼
                                                    ┌─────────────┐
                                                    │  Telegram  │
                                                    │   Alert   │
                                                    └─────────────┘
```

### Technology Stack

| Layer | Technology | Docker Service |
|-------|------------|----------------|
| Crawler | Python 3.11 + nse-python | `crawler` |
| Message Queue | Apache Kafka + Zookeeper | `kafka`, `zookeeper` |
| Consumer | Python 3.11 | `consumer` |
| Raw DB | MongoDB | `mongodb` |
| Metadata DB | PostgreSQL | `postgresql` |
| Alert Bot | Python + python-telegram-bot | `alert-bot` |
| Orchestration | Docker Compose | - |

---

## Data Models

### MongoDB: `ticks` Collection

```json
{
  "_id": ObjectId,
  "symbol": "RELIANCE",
  "timestamp": "2025-04-21T10:00:00Z",
  "open": 2450.00,
  "high": 2465.00,
  "low": 2440.00,
  "close": 2455.00,
  "volume": 12500000,
  "source": "nse",
  "created_at": "2025-04-21T10:05:00Z"
}
```

### PostgreSQL Schema

```sql
-- Watchlist: stocks being tracked
CREATE TABLE watchlist (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  added_at TIMESTAMP DEFAULT NOW(),
  active BOOLEAN DEFAULT TRUE
);

-- Alert configurations
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) REFERENCES watchlist(symbol),
  alert_type VARCHAR(20) NOT NULL,  -- 'price_drop', 'price_rise', 'volume_spike'
  threshold_percent DECIMAL(5,2) NOT NULL,
  triggered_at TIMESTAMP,
  enabled BOOLEAN DEFAULT TRUE
);

-- Daily aggregated summaries
CREATE TABLE price_history_daily (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  open DECIMAL(12,2),
  high DECIMAL(12,2),
  low DECIMAL(12,2),
  close DECIMAL(12,2),
  volume BIGINT,
  UNIQUE(symbol, date)
);
```

---

## Initial Configuration

### Watchlist (8 Nifty 50 stocks)
| Symbol | Name |
|--------|------|
| RELIANCE | Reliance Industries |
| TCS | Tata Consultancy Services |
| HDFCBANK | HDFC Bank |
| INFY | Infosys |
| ICICIBANK | ICICI Bank |
| SBIN | State Bank of India |
| ITC | ITC Limited |
| HINDUNILVR | Hindustan Unilever |

### Alert Rules (Default)
- Price drop > 2% in a day
- Price rise > 3% in a day
- Volume spike > 50% vs 30-day average

---

## Components

### 1. Crawler (`src/crawler/`)
- Fetches quotes via nse-python API
- Publishes to Kafka `raw_ticks` topic
- Runs via cron every 15-30 minutes

### 2. Consumer (`src/consumer/`)
- Reads from Kafka `raw_ticks`
- Validates: non-null prices, valid range, no duplicates
- Writes clean ticks to MongoDB
- Updates daily aggregates in PostgreSQL

### 3. Alert Engine (`src/alerts/`)
- Checks alert conditions on new ticks
- Sends Telegram notifications
- Tracks last triggered time to avoid spam

### 4. CLI (`src/cli/`)
- `add-stock SYMBOL` — add to watchlist
- `remove-stock SYMBOL` — remove from watchlist
- `set-alert SYMBOL --type price_drop --threshold 2`
- `list-stocks` — show watchlist
- `get-price SYMBOL` — get current price

### 5. Telegram Bot
- Polling bot for user interaction
- Commands: /start, /prices, /alerts, /add, /remove

---

## Deployment

### Docker Compose Services
```yaml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
  kafka:
    image: confluentinc/cp-kafka
    depends_on: [zookeeper]
    ports: [9092:9092]
  mongodb:
    image: mongo:7
    ports: [27017:27017]
  postgresql:
    image: postgres:16
    ports: [5432:5432]
  crawler:
    build: ./src/crawler
  consumer:
    build: ./src/consumer
  alert-bot:
    build: ./src/alert-bot
```

### Cron Schedule
```
*/15 * * * * cd /app && python -m crawler >> /var/log/crawler.log 2>&1
```
(Adjust to 15-30 min based on rate limits)

---

## Data Quality Rules

1. **Null check:** Discard ticks with missing price fields
2. **Range check:** Discard if price < 0 or > 100000
3. **Duplicate check:** Discard if tick exists within 1-minute window
4. **Volume check:** Discard if volume = 0 (market closed)

---

## Alert Logic

```python
# Pseudocode
for tick in new_ticks:
    alerts = get_alerts(tick.symbol)
    for alert in alerts:
        prev_price = get_previous_close(tick.symbol)
        change_percent = ((tick.close - prev_price) / prev_price) * 100

        if alert.type == 'price_drop' and change_percent < -alert.threshold:
            send_telegram_alert(symbol, f"Dropped {change_percent:.2f}%")
        elif alert.type == 'price_rise' and change_percent > alert.threshold:
            send_telegram_alert(symbol, f"Rose {change_percent:.2f}%")
```

---

## Environment Variables

```
# Kafka
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=raw_ticks

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=stockspy

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_DB=stockspy
POSTGRES_USER=stockspy
POSTGRES_PASSWORD=<secret>

# Telegram
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_CHAT_ID=<chat_id>

# NSE
NSE_DOWNLOAD_DIR=/tmp/nse_cache
```

---

## Acceptance Criteria

1. ✅ Can add/remove stocks from watchlist via CLI
2. ✅ Can set price/volume alert thresholds
3. ✅ Crawler fetches data every 15-30 minutes
4. ✅ Data stored in MongoDB (raw) and PostgreSQL (metadata)
5. ✅ Telegram bot sends alerts on threshold breach
6. ✅ Stores 30 days of price history
7. ✅ Docker Compose brings up all services
8. ✅ No duplicate or invalid ticks in database

---

## File Structure

```
stock-price-scraper/
├── docker-compose.yml
├── .env.example
├���─ docs/
│   └── superpowers/
│       └── specs/
│           └── 2025-04-21-stockspy-design.md
├── src/
│   ├── crawler/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py
│   ├── consumer/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py
│   ├── alerts/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── main.py
│   ├── cli/
│   │   ├── requirements.txt
│   │   └── main.py
│   └── telegram-bot/
│       ├── Dockerfile
│       ├── requirements.txt
│       └── main.py
└── tests/
    └── test_consumer.py
```