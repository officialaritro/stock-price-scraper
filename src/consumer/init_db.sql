-- StockSpy PostgreSQL Schema
-- Run this after PostgreSQL is up: docker exec -i stockspy-postgresql psql -U stockspy -d stockspy < src/consumer/init_db.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS vector;

-- Watchlist: stocks being tracked
CREATE TABLE IF NOT EXISTS watchlist (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255),
    added_at TIMESTAMP DEFAULT NOW(),
    active BOOLEAN DEFAULT TRUE
);

-- Alert configurations
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL REFERENCES watchlist(symbol) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL,
    threshold_percent DECIMAL(5,2) NOT NULL,
    triggered_at TIMESTAMP,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (alert_type IN ('price_drop', 'price_rise', 'volume_spike'))
);

-- Daily aggregated summaries
CREATE TABLE IF NOT EXISTS price_history_daily (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    open_price DECIMAL(12,2),
    high_price DECIMAL(12,2),
    low_price DECIMAL(12,2),
    close_price DECIMAL(12,2),
    volume BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(symbol, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlist_symbol ON watchlist(symbol);
CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(active);

CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_enabled ON alerts(enabled) WHERE enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_price_history_symbol ON price_history_daily(symbol);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history_daily(date);

-- Insert initial watchlist (8 Nifty 50 stocks)
INSERT INTO watchlist (symbol, name) VALUES
    ('RELIANCE', 'Reliance Industries'),
    ('TCS', 'Tata Consultancy Services'),
    ('HDFCBANK', 'HDFC Bank'),
    ('INFY', 'Infosys'),
    ('ICICIBANK', 'ICICI Bank'),
    ('SBIN', 'State Bank of India'),
    ('ITC', 'ITC Limited'),
    ('HINDUNILVR', 'Hindustan Unilever')
ON CONFLICT (symbol) DO NOTHING;

-- Insert default alert rules
INSERT INTO alerts (symbol, alert_type, threshold_percent) VALUES
    ('RELIANCE', 'price_drop', 2.00),
    ('RELIANCE', 'price_rise', 3.00),
    ('TCS', 'price_drop', 2.00),
    ('TCS', 'price_rise', 3.00),
    ('HDFCBANK', 'price_drop', 2.00),
    ('HDFCBANK', 'price_rise', 3.00),
    ('INFY', 'price_drop', 2.00),
    ('INFY', 'price_rise', 3.00),
    ('ICICIBANK', 'price_drop', 2.00),
    ('ICICIBANK', 'price_rise', 3.00),
    ('SBIN', 'price_drop', 2.00),
    ('SBIN', 'price_rise', 3.00),
    ('ITC', 'price_drop', 2.00),
    ('ITC', 'price_rise', 3.00),
    ('HINDUNILVR', 'price_drop', 2.00),
    ('HINDUNILVR', 'price_rise', 3.00)
ON CONFLICT DO NOTHING;

-- Helper function to get latest price
CREATE OR REPLACE FUNCTION get_latest_price(p_symbol VARCHAR(20))
RETURNS DECIMAL(12,2) AS $$
BEGIN
    RETURN (
        SELECT close_price
        FROM price_history_daily
        WHERE symbol = p_symbol
        ORDER BY date DESC
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql;

-- Helper function to get average volume
CREATE OR REPLACE FUNCTION get_average_volume(p_symbol VARCHAR(20), p_days INTEGER DEFAULT 30)
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT AVG(volume)::BIGINT
        FROM price_history_daily
        WHERE symbol = p_symbol
        AND date >= CURRENT_DATE - p_days
    );
END;
$$ LANGUAGE plpgsql;