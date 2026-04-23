-- Migration: Add rumor_disclosure_accepted to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS rumor_disclosure_accepted BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS rumor_disclosure_accepted_at TIMESTAMPTZ;
