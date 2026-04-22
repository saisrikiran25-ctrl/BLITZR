-- 016_fix_floor_feed.sql

-- 1. Fix Tickers (Floor) missing TypeORM defaults from raw SQL
UPDATE tickers 
SET 
    price_open = COALESCE(price_open, 0.005),
    college_domain = 'IIFT-KK'
WHERE ticker_id IN ('$AARAV', '$RIYA');

-- 2. Seed Intelligence Stream (Feed)
DO $$
DECLARE
    v_investor UUID;
    v_student1 UUID;
BEGIN
    SELECT user_id INTO v_investor FROM users WHERE email = 'investor@iift.edu';
    SELECT user_id INTO v_student1 FROM users WHERE email = 'student1@iift.edu';

    IF v_investor IS NOT NULL THEN
        -- Clear old demo rumors to avoid duplicates
        DELETE FROM rumor_posts WHERE author_id IN (v_investor, v_student1);

        INSERT INTO rumor_posts (
            post_id, author_id, ghost_id, text, tagged_tickers, 
            status, visibility, post_type, upvotes, college_domain, created_at
        )
        VALUES 
        (
            gen_random_uuid(), v_investor, 'Ghost_1A', 
            'Hearing that $AARAV is secretly building a new SaaS product that will blow $RIYA out of the water.', 
            ARRAY['$AARAV', '$RIYA'], 
            'VISIBLE', 'PUBLIC', 'OPINION', 42, 'IIFT-KK', NOW()
        ),
        (
            gen_random_uuid(), v_student1, 'Ghost_1B', 
            'Why is everyone selling their chips early? The National Case Study is literally 2 days away. HOLD!', 
            '{}', 
            'VISIBLE', 'PUBLIC', 'NEUTRAL', 15, 'IIFT-KK', NOW()
        );
    END IF;
END $$;
