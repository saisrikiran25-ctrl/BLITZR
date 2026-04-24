-- ============================================================
-- BLITZR-PRIME: Ultimate Floor Synchronization
-- Migration: 031_ultimate_floor_sync
-- Description: Dynamic re-linking of all tickers to their owner's institutional domain.
-- This fixes the "Empty Floor" issue by ensuring tickers always match the user's JWT domain.
-- ============================================================

DO $$
BEGIN
    -- 1. Synchronize tickers based on owner's real institution
    -- This handles any legacy short_codes or missing domains once and for all.
    UPDATE tickers t
    SET college_domain = i.email_domain
    FROM users u
    JOIN institutions i ON u.institution_id = i.institution_id
    WHERE t.owner_id = u.user_id
    AND t.college_domain != i.email_domain;

    -- 2. Ensure all tickers are ACTIVE if they aren't delisted/frozen
    -- Prevents tickers being stuck in 'PENDING' or NULL status from old bugs.
    UPDATE tickers 
    SET status = 'ACTIVE' 
    WHERE status IS NULL OR (status != 'DELISTED' AND status != 'FROZEN' AND status != 'AUTO_FROZEN');

    -- 3. Sync rumor posts as well
    -- Ensures the Intelligence Stream matches the Floor.
    UPDATE rumor_posts r
    SET college_domain = i.email_domain
    FROM users u
    JOIN institutions i ON u.institution_id = i.institution_id
    WHERE r.author_id = u.user_id
    AND r.college_domain != i.email_domain;

    RAISE NOTICE 'Surgically synchronized all tickers and rumors with institutional domains.';
END $$;
