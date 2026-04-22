-- 020_deactivate_lockdown.sql
-- Deactivating the GLOBAL LOCKDOWN system override to restore intelligence broadcasts.

UPDATE settings 
SET value = 'false' 
WHERE key = 'GLOBAL_LOCKDOWN';

-- Precision Check: Ensure all rumors are set to PUBLIC for the demo
UPDATE rumor_posts 
SET visibility = 'PUBLIC' 
WHERE visibility = 'PENDING';
