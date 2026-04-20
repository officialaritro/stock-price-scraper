.PHONY: help up down logs init add crawling

help:
	@echo "StockSpy - Stock Price Crawler & Market Alert System"
	@echo ""
	@echo "Available commands:"
	@echo "  make up          - Start all services"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - View logs"
	@echo "  make init        - Initialize PostgreSQL schema"
	@echo "  make add SYMBOL  - Add stock to watchlist"
	@echo "  make remove      - Remove stock from watchlist"

up:
	docker-compose up -d
	@echo "Waiting for services to be ready..."
	@sleep 10
	@echo "Services started. Initialize the database with: make init"

down:
	docker-compose down

logs:
	docker-compose logs -f

init:
	docker exec -i stockspy-postgresql psql -U stockspy -d stockspy < src/consumer/init_db.sql
	@echo "Database initialized with schema and seed data"

# Add a crawler entry to crontab
cron:
	@echo "*/15 * * * * docker exec stockspy-crawler python /app/main.py >> /var/log/crawler.log 2>&1" | crontab -

# Run crawler once manually
crawl:
	docker exec stockspy-crawler python /app/main.py

# Add stock to watchlist
add:
	@if [ -z "$(SYMBOL)" ]; then echo "Usage: make add SYMBOL=RELIANCE"; exit 1; fi
	docker exec -i stockspy-postgresql psql -U stockspy -d stockspy -c "INSERT INTO watchlist (symbol) VALUES ('$(SYMBOL)') ON CONFLICT (symbol) DO NOTHING"

# Remove stock from watchlist
remove:
	@if [ -z "$(SYMBOL)" ]; then echo "Usage: make remove SYMBOL=RELIANCE"; exit 1; fi
	docker exec -i stockspy-postgresql psql -U stockspy -d stockspy -c "DELETE FROM watchlist WHERE symbol = '$(SYMBOL)'"

# List watchlist
list:
	docker exec -i stockspy-postgresql psql -U stockspy -d stockspy -c "SELECT * FROM watchlist"

# List alerts
list-alerts:
	docker exec -i stockspy-postgresql psql -U stockspy -d stockspy -c "SELECT * FROM alerts"

# Show MongoDB data
show-mongo:
	docker exec -i stockspy-mongodb mongosh -u stockspy -p stockspy --authenticationDatabase stockspy stockspy --eval "db.ticks.find().sort({timestamp:-1}).limit(10)"