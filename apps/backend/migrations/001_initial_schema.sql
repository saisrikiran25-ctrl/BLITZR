-- ============================================================
-- BLITZR-PRIME: PostgreSQL Schema v1.0
-- Project: Campus Social-Equity Exchange
-- Migration: 001_initial_schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE tx_type AS ENUM ('BUY', 'SELL', 'BET', 'DIVIDEND', 'BURN', 'EXCHANGE', 'TRANSFER', 'FEE');
CREATE TYPE ticker_status AS ENUM ('ACTIVE', 'FROZEN', 'DELISTED');
CREATE TYPE prop_event_status AS ENUM ('OPEN', 'CLOSED', 'SETTLED', 'CANCELLED');
CREATE TYPE prop_outcome AS ENUM ('YES', 'NO');
CREATE TYPE rumor_status AS ENUM ('VISIBLE', 'MODERATED', 'DELETED');

-- ============================================================
-- TABLE: users
-- The central user identity & dual-currency wallet.
-- Creds support 4 decimal places for fractional exchange.
-- ============================================================

CREATE TABLE users (
    user_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    username        VARCHAR(50)  NOT NULL UNIQUE,
    display_name    VARCHAR(100),
    password_hash   TEXT NOT NULL,
    
    -- Dual-currency wallet (4 decimal precision)
    cred_balance    DECIMAL(18, 4) NOT NULL DEFAULT 100.0000,
    chip_balance    DECIMAL(18, 4) NOT NULL DEFAULT 200.0000,
    
    -- IPO status
    is_ipo_active   BOOLEAN NOT NULL DEFAULT FALSE,
    dividend_earned DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    
    -- Metadata
    college_domain  VARCHAR(100),
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints: no negative balances (database-level enforcement)
    CONSTRAINT chk_cred_non_negative CHECK (cred_balance >= 0),
    CONSTRAINT chk_chip_non_negative CHECK (chip_balance >= 0)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- TABLE: tickers
-- Each user who IPOs gets a ticker (e.g., "$RAHUL").
-- current_supply is the CRITICAL field locked during trades
-- via SELECT ... FOR UPDATE to prevent the "Priya Slap" race.
-- ============================================================

CREATE TABLE tickers (
    ticker_id       VARCHAR(50) PRIMARY KEY,
    owner_id        UUID NOT NULL REFERENCES users(user_id),
    
    -- Bonding curve state
    current_supply  BIGINT NOT NULL DEFAULT 1,
    scaling_constant DECIMAL(18, 4) NOT NULL DEFAULT 200.0000,
    
    -- Market data
    total_volume    DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_trades    BIGINT NOT NULL DEFAULT 0,
    human_trades_1h INTEGER NOT NULL DEFAULT 0,
    
    -- Status management
    status          ticker_status NOT NULL DEFAULT 'ACTIVE',
    frozen_until    TIMESTAMPTZ,
    
    -- Category (for heatmap grouping)
    category        VARCHAR(100),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_supply_positive CHECK (current_supply >= 0),
    CONSTRAINT fk_ticker_owner UNIQUE (owner_id)
);

CREATE INDEX idx_tickers_owner ON tickers(owner_id);
CREATE INDEX idx_tickers_status ON tickers(status);
CREATE INDEX idx_tickers_category ON tickers(category);

-- ============================================================
-- TABLE: holdings
-- Who owns how many shares of which ticker.
-- Unique constraint on (user_id, ticker_id) for UPSERT pattern.
-- ============================================================

CREATE TABLE holdings (
    holding_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    ticker_id       VARCHAR(50) NOT NULL REFERENCES tickers(ticker_id),
    shares_held     BIGINT NOT NULL DEFAULT 0,
    avg_buy_price   DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_user_ticker UNIQUE (user_id, ticker_id),
    CONSTRAINT chk_shares_non_negative CHECK (shares_held >= 0)
);

CREATE INDEX idx_holdings_user ON holdings(user_id);
CREATE INDEX idx_holdings_ticker ON holdings(ticker_id);

-- ============================================================
-- TABLE: transactions
-- Immutable ledger of every financial action.
-- ============================================================

CREATE TABLE transactions (
    tx_id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(user_id),
    
    -- Asset reference (polymorphic: either a ticker or prop event)
    ticker_id           VARCHAR(50) REFERENCES tickers(ticker_id),
    prop_event_id       UUID,
    
    -- Trade details
    tx_type             tx_type NOT NULL,
    shares_quantity     BIGINT,
    amount              DECIMAL(18, 4) NOT NULL,
    price_at_execution  DECIMAL(18, 4),
    supply_at_execution BIGINT,
    
    -- Fee breakdown
    burn_amount         DECIMAL(18, 4) DEFAULT 0.0000,
    dividend_amount     DECIMAL(18, 4) DEFAULT 0.0000,
    platform_fee_amount DECIMAL(18, 4) DEFAULT 0.0000,
    
    -- Currency used
    currency            VARCHAR(10) NOT NULL DEFAULT 'CRED',
    
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- At least one asset reference must exist
    CONSTRAINT chk_asset_ref CHECK (ticker_id IS NOT NULL OR prop_event_id IS NOT NULL)
);

CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_ticker ON transactions(ticker_id);
CREATE INDEX idx_tx_type ON transactions(tx_type);
CREATE INDEX idx_tx_created ON transactions(created_at);

-- ============================================================
-- TABLE: prop_events
-- Predictive markets (The "Arena" tab).
-- Pari-mutuel betting pool with YES/NO binary outcomes.
-- ============================================================

CREATE TABLE prop_events (
    event_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_id      UUID NOT NULL REFERENCES users(user_id),
    
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    category        VARCHAR(50),
    
    -- Pool state
    status          prop_event_status NOT NULL DEFAULT 'OPEN',
    yes_pool        DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    no_pool         DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    
    -- Resolution
    winning_outcome prop_outcome,
    referee_id      UUID REFERENCES users(user_id),
    
    -- Timing
    expiry_timestamp    TIMESTAMPTZ NOT NULL,
    settled_at          TIMESTAMPTZ,
    
    -- Fees
    listing_fee_paid    DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    platform_fee_rate   DECIMAL(5, 4) NOT NULL DEFAULT 0.0500,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add the FK on transactions now that prop_events exists
ALTER TABLE transactions 
    ADD CONSTRAINT fk_tx_prop_event 
    FOREIGN KEY (prop_event_id) REFERENCES prop_events(event_id);

CREATE INDEX idx_prop_events_status ON prop_events(status);
CREATE INDEX idx_prop_events_expiry ON prop_events(expiry_timestamp);
CREATE INDEX idx_prop_events_creator ON prop_events(creator_id);

-- ============================================================
-- TABLE: prop_bets
-- Individual user bets on prop events.
-- ============================================================

CREATE TABLE prop_bets (
    bet_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id        UUID NOT NULL REFERENCES prop_events(event_id),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    
    outcome_choice  prop_outcome NOT NULL,
    chip_amount     DECIMAL(18, 4) NOT NULL,
    
    -- Payout (calculated on settlement)
    payout_amount   DECIMAL(18, 4),
    is_settled      BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_bet_positive CHECK (chip_amount > 0)
);

CREATE INDEX idx_prop_bets_event ON prop_bets(event_id);
CREATE INDEX idx_prop_bets_user ON prop_bets(user_id);

-- ============================================================
-- TABLE: rumors
-- Anonymous posts for the "Rumor Feed" / Intelligence Stream.
-- ============================================================

CREATE TABLE rumors (
    rumor_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id       UUID NOT NULL REFERENCES users(user_id),
    ghost_id        VARCHAR(20) NOT NULL,
    
    content         TEXT NOT NULL,
    tagged_tickers  VARCHAR(50)[] DEFAULT '{}',
    
    -- Moderation
    status          rumor_status NOT NULL DEFAULT 'VISIBLE',
    toxicity_score  DECIMAL(5, 4),
    
    -- Engagement
    upvotes         INTEGER NOT NULL DEFAULT 0,
    downvotes       INTEGER NOT NULL DEFAULT 0,
    
    -- Paid features
    is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
    pinned_until    TIMESTAMPTZ,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rumors_created ON rumors(created_at DESC);
CREATE INDEX idx_rumors_status ON rumors(status);
CREATE INDEX idx_rumors_tagged ON rumors USING GIN(tagged_tickers);

-- ============================================================
-- TABLE: ohlc_candles
-- Aggregated price data for charting (1m, 5m, 1h, 1d).
-- ============================================================

CREATE TABLE ohlc_candles (
    candle_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker_id       VARCHAR(50) NOT NULL REFERENCES tickers(ticker_id),
    
    interval        VARCHAR(5) NOT NULL,
    bucket_start    TIMESTAMPTZ NOT NULL,
    
    open_price      DECIMAL(18, 4) NOT NULL,
    high_price      DECIMAL(18, 4) NOT NULL,
    low_price       DECIMAL(18, 4) NOT NULL,
    close_price     DECIMAL(18, 4) NOT NULL,
    volume          DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    trade_count     INTEGER NOT NULL DEFAULT 0,
    
    CONSTRAINT uq_candle UNIQUE (ticker_id, interval, bucket_start)
);

CREATE INDEX idx_candles_ticker_interval ON ohlc_candles(ticker_id, interval, bucket_start);

-- ============================================================
-- TABLE: platform_wallet
-- Singleton row for platform-level accounting.
-- ============================================================

CREATE TABLE platform_wallet (
    id                  INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    reserve_creds       DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    reserve_chips       DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_burned_creds  DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    total_burned_chips  DECIMAL(18, 4) NOT NULL DEFAULT 0.0000,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the singleton
INSERT INTO platform_wallet (id) VALUES (1);

-- ============================================================
-- TABLE: currency_exchanges
-- Log of Cred <-> Chip conversions (1 Cred = 2 Chips).
-- ============================================================

CREATE TABLE currency_exchanges (
    exchange_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    
    from_currency   VARCHAR(10) NOT NULL,
    to_currency     VARCHAR(10) NOT NULL,
    from_amount     DECIMAL(18, 4) NOT NULL,
    to_amount       DECIMAL(18, 4) NOT NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_different_currencies CHECK (from_currency != to_currency),
    CONSTRAINT chk_positive_amounts CHECK (from_amount > 0 AND to_amount > 0)
);

CREATE INDEX idx_exchanges_user ON currency_exchanges(user_id);

-- ============================================================
-- SCHEMA COMPLETE
-- Tables: 10 (users, tickers, holdings, transactions,
--             prop_events, prop_bets, rumors, ohlc_candles,
--             platform_wallet, currency_exchanges)
-- ============================================================
