-- ============================================================
-- Migration: 008_admin_roles_activity
-- Adds admin role, last active tracking, and rumor survival flag
-- ============================================================

-- Users: role + last_active_at
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Rumor posts: mark credibility rewards to avoid duplicate payouts
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS credibility_rewarded BOOLEAN DEFAULT FALSE;

-- Prop events: add PAUSED status for admin emergency controls
ALTER TYPE prop_event_status ADD VALUE IF NOT EXISTS 'PAUSED';

-- Prop events: options metadata for admin-created markets
ALTER TABLE prop_events ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]';
