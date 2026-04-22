-- 011_add_user_notification_prefs.sql

-- Add missing notification preference columns to the users table
-- These columns align with the UserEntity to prevent TypeORM QueryFailedErrors

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS notify_trading BOOLEAN DEFAULT TRUE, 
ADD COLUMN IF NOT EXISTS notify_price_threshold BOOLEAN DEFAULT TRUE, 
ADD COLUMN IF NOT EXISTS notify_arena_resolution BOOLEAN DEFAULT TRUE;
