-- 018_fix_rumor_infrastructure.sql
-- Aligning 'rumors' table with TypeORM 'rumor_posts' and creating missing moderation_queue.

-- 1. Rename table to match RumorEntity
DO $$
BEGIN
    IF to_regclass('public.rumors') IS NOT NULL
       AND to_regclass('public.rumor_posts') IS NULL THEN
        ALTER TABLE rumors RENAME TO rumor_posts;
    END IF;
END $$;

-- 2. Rename columns to match Entity properties
-- rumor_id (migration 001) -> post_id (RumorEntity code)
DO $$
BEGIN
    IF to_regclass('public.rumor_posts') IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'rumor_id'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'post_id'
        ) THEN
            ALTER TABLE rumor_posts RENAME COLUMN rumor_id TO post_id;
        END IF;

        -- content (migration 001) -> text (RumorEntity code)
        IF EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'content'
        )
        AND NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'text'
        ) THEN
            ALTER TABLE rumor_posts RENAME COLUMN content TO text;
        END IF;
    END IF;
END $$;

-- 3. Create missing moderation_queue table (Required by RumorFeedService)
CREATE TABLE IF NOT EXISTS moderation_queue (
    queue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_type VARCHAR(100) NOT NULL,
    post_id UUID NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    -- Ensure post_id maps to rumor_posts (foreign key) when parent schema is present
    IF to_regclass('public.moderation_queue') IS NOT NULL
       AND to_regclass('public.rumor_posts') IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'post_id'
       )
       AND NOT EXISTS (
            SELECT 1
            FROM pg_constraint c
            JOIN pg_class t ON t.oid = c.conrelid
            JOIN pg_namespace n ON n.oid = t.relnamespace
            WHERE c.conname = 'fk_moderation_post'
              AND t.relname = 'moderation_queue'
              AND n.nspname = 'public'
       ) THEN
        ALTER TABLE moderation_queue
            ADD CONSTRAINT fk_moderation_post
            FOREIGN KEY (post_id) REFERENCES rumor_posts(post_id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Ensure we have indexes for performance (Precision check)
CREATE INDEX IF NOT EXISTS idx_mod_queue_post ON moderation_queue(post_id);
DO $$
BEGIN
    IF to_regclass('public.rumor_posts') IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'college_domain'
       ) THEN
        CREATE INDEX IF NOT EXISTS idx_rumor_posts_domain ON rumor_posts(college_domain);
    END IF;
END $$;

-- 5. Alignment Fix: Ensure all existing rumors in IIFT are using 'IIFT-KK' shortCode
DO $$
BEGIN
    IF to_regclass('public.rumor_posts') IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'rumor_posts'
              AND column_name = 'college_domain'
       ) THEN
        UPDATE rumor_posts
        SET college_domain = 'IIFT-KK'
        WHERE college_domain = 'iift.edu' OR college_domain IS NULL;
    END IF;
END $$;
