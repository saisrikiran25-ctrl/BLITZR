-- 010_fix_username_constraint.sql

-- 1. Remove the global unique constraint on username which was inherited from the initial multi-tenant schema
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;
DROP INDEX IF EXISTS idx_users_username;

-- 2. Establish composite unique constraint ensuring username uniqueness is strictly evaluated against the institution scope
-- This allows two @johndoe to coexist exclusively if they strictly belong to completely separate campuses.
ALTER TABLE users ADD CONSTRAINT uq_users_institution_username UNIQUE (institution_id, username);
