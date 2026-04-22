-- ============================================================
-- Migration: 008_crisis_management
-- Description: Adds settings table for global control flags
-- ============================================================

CREATE TABLE IF NOT EXISTS settings (
    key       VARCHAR(100) PRIMARY KEY,
    value     TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed GLOBAL_LOCKDOWN as false
INSERT INTO settings (key, value)
VALUES ('GLOBAL_LOCKDOWN', 'false')
ON CONFLICT (key) DO NOTHING;
