-- ============================================================
-- Migration: 006_master_doc_migrations
-- Consolidating all Group 1 Database Migrations from Master PDF
-- ============================================================

-- Migration 1: Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
    institution_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    short_code       VARCHAR(20) NOT NULL UNIQUE,
    email_domain     VARCHAR(100) NOT NULL UNIQUE,
    city             VARCHAR(100),
    verified         BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the first institution
INSERT INTO institutions (name, short_code, email_domain, city, verified)
VALUES ('IIFT Delhi', 'IIFT-D', 'iift.edu', 'Delhi', TRUE)
ON CONFLICT DO NOTHING;

-- Migration 2: Modify Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(institution_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS credibility_score INTEGER NOT NULL DEFAULT 0;
-- Note: 'tos_accepted' was added in 003, but ensuring it maps perfectly
ALTER TABLE users ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;

-- Migration 3: Modify Tickers Table
ALTER TYPE ticker_status ADD VALUE IF NOT EXISTS 'AUTO_FROZEN';
ALTER TYPE ticker_status ADD VALUE IF NOT EXISTS 'MANUAL_FROZEN';

-- Migration 4: Modify Prop Events Table
DO $$ BEGIN
    CREATE TYPE prop_scope AS ENUM ('LOCAL', 'REGIONAL', 'NATIONAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE prop_events ADD COLUMN IF NOT EXISTS scope prop_scope NOT NULL DEFAULT 'LOCAL';
ALTER TABLE prop_events ADD COLUMN IF NOT EXISTS institution_id UUID REFERENCES institutions(institution_id);
ALTER TABLE prop_events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE;

-- Rename rumors to rumor_posts for spec alignment
ALTER TABLE IF EXISTS rumors RENAME TO rumor_posts;
ALTER TABLE IF EXISTS rumor_posts RENAME COLUMN rumor_id TO post_id;

-- Migration 5: Modify Rumor Posts Table
DO $$ BEGIN
    CREATE TYPE post_type_enum AS ENUM ('FACTUAL_CLAIM', 'OPINION', 'NEUTRAL');
    CREATE TYPE visibility_enum AS ENUM ('PUBLIC', 'PENDING', 'HIDDEN', 'REMOVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS post_type post_type_enum DEFAULT 'NEUTRAL';
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS risk_score DECIMAL(3,2) DEFAULT 0.0;
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS visibility visibility_enum DEFAULT 'PUBLIC';
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS moderation_flag VARCHAR(100) DEFAULT NULL;
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS market_impact_triggered BOOLEAN DEFAULT FALSE;
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS price_snapshot JSONB DEFAULT '{}';

-- Migration 6: Post Disputes Table
CREATE TABLE IF NOT EXISTS post_disputes (
    dispute_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id      UUID REFERENCES rumor_posts(post_id) ON DELETE CASCADE,
    user_id      UUID REFERENCES users(user_id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Migration 7: National Leaderboard Table
CREATE TABLE IF NOT EXISTS national_leaderboard (
    entry_id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticker_id          VARCHAR(50) REFERENCES tickers(ticker_id),
    institution_id     UUID REFERENCES institutions(institution_id),
    campus_rank        INTEGER,
    national_rank      INTEGER,
    snapshot_price     DECIMAL(18,4),
    snapshot_volume    DECIMAL(18,4),
    featured           BOOLEAN DEFAULT FALSE,
    computed_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 8: Moderation Queue Table
DO $$ BEGIN
    CREATE TYPE mod_queue_status AS ENUM ('PENDING', 'REVIEWED_CLEARED', 'REVIEWED_REMOVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS moderation_queue (
    queue_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_type      VARCHAR(100) NOT NULL,
    post_id        UUID REFERENCES rumor_posts(post_id),
    ticker_id      VARCHAR(50),
    meta           JSONB DEFAULT '{}',
    status         mod_queue_status DEFAULT 'PENDING',
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at    TIMESTAMPTZ
);

-- Migration 9: Waitlist Table
CREATE TABLE IF NOT EXISTS waitlist (
    waitlist_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email          VARCHAR(255) NOT NULL UNIQUE,
    email_domain   VARCHAR(100) NOT NULL,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Migration 10: Admin Analytics Table
DROP TABLE IF EXISTS admin_analytics CASCADE;
CREATE TABLE admin_analytics (
    snapshot_id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id    UUID REFERENCES institutions(institution_id),
    dept_sentiment    JSONB DEFAULT '{}',
    avg_score_change  DECIMAL(8,4),
    total_trades      INTEGER,
    active_users      INTEGER,
    flagged_posts     INTEGER,
    computed_at       TIMESTAMPTZ DEFAULT NOW()
);
