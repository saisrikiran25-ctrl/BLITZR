-- 015_add_college_domain_partition.sql
-- Adding missing college_domain column for RLMT domain partitioning across core tables.

-- Tickers
ALTER TABLE tickers ADD COLUMN IF NOT EXISTS college_domain VARCHAR(100) DEFAULT 'iift.edu';
CREATE INDEX IF NOT EXISTS idx_tickers_domain ON tickers(college_domain);

-- Rumor Posts (Renamed from rumors in 007)
ALTER TABLE rumor_posts ADD COLUMN IF NOT EXISTS college_domain VARCHAR(100) DEFAULT 'iift.edu';
CREATE INDEX IF NOT EXISTS idx_rumor_posts_domain ON rumor_posts(college_domain);

-- Prop Events
ALTER TABLE prop_events ADD COLUMN IF NOT EXISTS college_domain VARCHAR(100) DEFAULT 'iift.edu';
CREATE INDEX IF NOT EXISTS idx_prop_events_domain ON prop_events(college_domain);
