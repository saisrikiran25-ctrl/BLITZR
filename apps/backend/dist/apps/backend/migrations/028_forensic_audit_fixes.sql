-- ============================================================
-- BLITZR-PRIME: Forensic Audit Fixes (ULTRA-RESILIENT VERSION)
-- Migration: 028_forensic_audit_fixes
-- Description: Cascading fix for domain mismatch, multi-campus support, and enum parity.
-- ============================================================

-- 1. Ensure Multi-Campus Support (Bug #2)
-- Drops the restrictive UNIQUE on email_domain and replaces with institutional scoping.
ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_email_domain_key;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_campus_name') THEN
        ALTER TABLE institutions ADD CONSTRAINT uq_campus_name UNIQUE (email_domain, name);
    END IF;
END $$;

-- 2. Add PENDING to ticker_status ENUM (Bug #3)
-- Ensures parity between TickerEntity.ts and PostgreSQL.
ALTER TYPE ticker_status ADD VALUE IF NOT EXISTS 'PENDING';

-- 3. Backfill college_domain Consistency (Bug #1)
-- Normalizes all college_domain columns to use email_domain (e.g., 'iift.edu') instead of short_codes.
-- Using dynamic check to handle table renames in production (e.g., rumors vs rumor_posts).

-- tickers
UPDATE tickers SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');

-- rumors / rumor_posts
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rumor_posts') THEN
        UPDATE rumor_posts SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rumors') THEN
        UPDATE rumors SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
    END IF;
END $$;

-- prop_events
UPDATE prop_events SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');

-- users
UPDATE users SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
