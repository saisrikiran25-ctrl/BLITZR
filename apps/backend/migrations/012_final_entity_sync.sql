-- 012_final_entity_sync.sql
-- Resolving the remaining Schema-TypeORM discrepancies identified during complete audit.

-- 1. Patch 'rumor_posts' tagged_tickers expected missing column
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS tagged_tickers VARCHAR[] DEFAULT '{}';


-- 2. Patch 'ohlc_candles' missing enum and required metric columns
DO $$ BEGIN
    CREATE TYPE ohlc_candles_interval_enum AS ENUM ('1m', '5m', '1h', '1d');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE ohlc_candles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ohlc_candles ADD COLUMN IF NOT EXISTS interval ohlc_candles_interval_enum NOT NULL DEFAULT '1d';
ALTER TABLE ohlc_candles ADD COLUMN IF NOT EXISTS volume BIGINT DEFAULT 0;
