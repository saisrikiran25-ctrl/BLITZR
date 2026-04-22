-- 018_fix_rumor_infrastructure.sql
-- Aligning 'rumors' table with TypeORM 'rumor_posts' and creating missing moderation_queue.

-- 1. Rename table to match RumorEntity
ALTER TABLE IF EXISTS rumors RENAME TO rumor_posts;

-- 2. Rename columns to match Entity properties
-- rumor_id (migration 001) -> post_id (RumorEntity code)
ALTER TABLE rumor_posts RENAME COLUMN rumor_id TO post_id;

-- content (migration 001) -> text (RumorEntity code)
ALTER TABLE rumor_posts RENAME COLUMN content TO text;

-- 3. Create missing moderation_queue table (Required by RumorFeedService)
CREATE TABLE IF NOT EXISTS moderation_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_type VARCHAR(100) NOT NULL,
    post_id UUID NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure post_id maps to rumor_posts (foreign key)
    CONSTRAINT fk_moderation_post FOREIGN KEY (post_id) REFERENCES rumor_posts(post_id) ON DELETE CASCADE
);

-- 4. Ensure we have indexes for performance (Precision check)
CREATE INDEX IF NOT EXISTS idx_mod_queue_post ON moderation_queue(post_id);
CREATE INDEX IF NOT EXISTS idx_rumor_posts_domain ON rumor_posts(college_domain);

-- 5. Alignment Fix: Ensure all existing rumors in IIFT are using 'IIFT-KK' shortCode
UPDATE rumor_posts 
SET college_domain = 'IIFT-KK' 
WHERE college_domain = 'iift.edu' OR college_domain IS NULL;
