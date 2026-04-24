-- ============================================================
-- BLITZR-PRIME: Forensic Audit Fixes (IDEMPOTENT VERSION)
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
-- Note: ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in older PG versions,
-- but standard NestJS migration runners handles this. ADD VALUE IF NOT EXISTS is safe in PG 12+.
ALTER TYPE ticker_status ADD VALUE IF NOT EXISTS 'PENDING';

-- 3. Backfill college_domain Consistency (Bug #1)
-- Normalizes all college_domain columns to use email_domain (e.g., 'iift.edu') instead of short_codes.
UPDATE tickers SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
UPDATE rumors SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
UPDATE prop_events SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
UPDATE users SET college_domain = 'iift.edu' WHERE college_domain IN ('IIFT-D', 'IIFT-K', 'IIFT-KK');
