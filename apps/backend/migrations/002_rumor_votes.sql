-- ============================================================
-- BLITZR-PRIME: PostgreSQL Schema Expansion
-- Migration: 002_rumor_votes
-- ============================================================

-- Create Enum for vote types
CREATE TYPE rumor_vote_type AS ENUM ('UP', 'DOWN');

-- ============================================================
-- TABLE: rumor_votes
-- Ledger to mathematically prohibit multiple votes per user 
-- on the same rumor.
-- ============================================================
CREATE TABLE rumor_votes (
    vote_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(user_id),
    rumor_id        UUID NOT NULL REFERENCES rumors(rumor_id),
    
    vote_type       rumor_vote_type NOT NULL,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Crucial Constraint: One vote per user per rumor
    CONSTRAINT uq_user_rumor_vote UNIQUE (user_id, rumor_id)
);

CREATE INDEX idx_rumor_votes_user ON rumor_votes(user_id);
CREATE INDEX idx_rumor_votes_rumor ON rumor_votes(rumor_id);
