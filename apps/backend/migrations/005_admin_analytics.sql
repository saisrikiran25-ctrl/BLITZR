// apps/backend/migrations/005_admin_analytics.sql

CREATE TABLE IF NOT EXISTS admin_analytics (
    id SERIAL PRIMARY KEY,
    total_clout DECIMAL(18, 4) DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    flagged_posts_count INTEGER DEFAULT 0,
    recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
