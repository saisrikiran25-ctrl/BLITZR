CREATE TABLE IF NOT EXISTS admin_analytics (
    id SERIAL PRIMARY KEY
);

-- Actually, let's just add the fields to users for migration 004
ALTER TABLE users
ADD COLUMN IF NOT EXISTS tos_accepted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tos_accepted_at TIMESTAMPTZ;
