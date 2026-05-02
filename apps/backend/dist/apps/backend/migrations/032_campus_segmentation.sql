-- ============================================================
-- BLITZR-PRIME: Campus-Based Floor Segmentation
-- Migration: 032_campus_segmentation
-- Description: Reverts the global normalization and splits the Floor into specific campuses.
-- ============================================================

DO $$
BEGIN
    -- 1. Split tickers back into specific Campus Short Codes
    -- (IIFT-D, IIFT-K, IIFT-KK instead of generic iift.edu)
    UPDATE tickers t
    SET college_domain = i.short_code
    FROM users u
    JOIN institutions i ON u.institution_id = i.institution_id
    WHERE t.owner_id = u.user_id;

    -- 2. Sync rumor posts to specific Campus Short Codes
    UPDATE rumor_posts r
    SET college_domain = i.short_code
    FROM users u
    JOIN institutions i ON u.institution_id = i.institution_id
    WHERE r.author_id = u.user_id;

    RAISE NOTICE 'Disaggregated the Floor into campus-specific silos.';
END $$;
