-- ============================================================
-- Migration: 002_add_price_open
-- Adds session-open price tracking to tickers table.
-- price_open: set at IPO creation, reset every 24h to current price.
-- This enables NYSE-style session percentage change instead of
-- all-time change from inception.
-- ============================================================

ALTER TABLE tickers
    ADD COLUMN IF NOT EXISTS price_open DECIMAL(18, 4) NOT NULL DEFAULT 0.0050;

-- Backfill existing tickers: set price_open to P(1) = 1/200 = 0.005
-- so current open % will reflect growth from last known session start.
-- A subsequent Cron will automatically reset these every 24h.
UPDATE tickers
    SET price_open = ROUND(
        CAST((current_supply * current_supply) AS DECIMAL(18,4)) / 200.0,
        4
    )
WHERE price_open = 0.0050;
