-- ============================================================
-- Migration: 036_daily_login_reward
-- Purpose: Track last daily login reward timestamp per user
--          so we can credit 100 chips once per calendar day.
-- ============================================================

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS last_daily_reward_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN users.last_daily_reward_at IS
    'UTC timestamp of the last time this user received their 100-chip daily login reward. NULL means never rewarded.';
