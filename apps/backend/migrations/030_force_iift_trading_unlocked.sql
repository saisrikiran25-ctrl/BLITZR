-- ============================================================
-- BLITZR-PRIME: Global IIFT Trading Unlock
-- Migration: 030_force_iift_trading_unlocked
-- Description: Aggressively normalizes all IIFT data to allow cross-campus trading.
-- ============================================================

-- 1. Institutional Normalization
-- Ensure all IIFT institutions use 'iift.edu' as their email_domain consistently.
UPDATE institutions 
SET email_domain = 'iift.edu' 
WHERE email_domain ILIKE '%iift%' OR name ILIKE '%IIFT%';

-- 2. Ticker Field Normalization
-- High Severity: Force all tickers potentially belonging to IIFT to 'iift.edu' and 'ACTIVE'.
UPDATE tickers 
SET college_domain = 'iift.edu', 
    status = 'ACTIVE'
WHERE college_domain ILIKE '%iift%' 
   OR college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK', 'iift.edu');

-- 3. User Field Normalization
-- Ensure all users with iift emails are mapped to the 'iift.edu' domain in DB for JWT consistency.
UPDATE users 
SET college_domain = 'iift.edu'
WHERE email ILIKE '%@iift.edu' 
   OR college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');

-- 4. Rumor/Event Consistency (Optional but good for sanity)
UPDATE rumor_posts SET college_domain = 'iift.edu' WHERE college_domain ILIKE '%iift%';
UPDATE prop_events SET college_domain = 'iift.edu' WHERE college_domain ILIKE '%iift%';

-- 5. Final Safety: If any tickers are still NULL or PENDING, wake them up.
-- (Only for iift domain)
UPDATE tickers 
SET status = 'ACTIVE' 
WHERE college_domain = 'iift.edu' 
  AND (status IS NULL OR status = 'PENDING');
