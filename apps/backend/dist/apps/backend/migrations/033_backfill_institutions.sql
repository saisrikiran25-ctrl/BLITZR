-- 033_backfill_institutions.sql
-- Goal: Ensure every user has a valid institution_id based on their email domain / college_domain.
-- This fixes the "Missing Institution" trade failure for legacy accounts.

DO $$
DECLARE
    inst_rec RECORD;
BEGIN
    -- 1. First, backfill based on exact email domain matches
    FOR inst_rec IN SELECT institution_id, email_domain FROM institutions LOOP
        UPDATE users 
        SET institution_id = inst_rec.institution_id 
        WHERE institution_id IS NULL 
        AND email LIKE '%' || inst_rec.email_domain;
    END LOOP;

    -- 2. Then, backfill based on college_domain matches (for those who have it set but no ID)
    FOR inst_rec IN SELECT institution_id, short_code FROM institutions LOOP
        UPDATE users 
        SET institution_id = inst_rec.institution_id 
        WHERE institution_id IS NULL 
        AND college_domain = inst_rec.short_code;
    END LOOP;

    -- 3. Safety fallback for IIFT (the most common case)
    -- If they have 'iift.edu' but no institution_id, default to IIFT-D (Delhi)
    UPDATE users
    SET institution_id = (SELECT institution_id FROM institutions WHERE short_code = 'IIFT-D' LIMIT 1)
    WHERE institution_id IS NULL
    AND email LIKE '%iift.edu';

END $$;
