-- Migration: 037_fix_ticker_featured
-- Adding missing featured column to tickers table

ALTER TABLE tickers ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;
