-- MIGRATION: 022_remove_cidwecc_event
-- Surgically removes the 'CIDWECC' event and its dependencies from the database.

-- 1. Remove bets associated with this event
DELETE FROM prop_bets 
WHERE event_id IN (SELECT event_id FROM prop_events WHERE title = 'CIDWECC');

-- 2. Remove transactions associated with this event
DELETE FROM transactions 
WHERE prop_event_id IN (SELECT event_id FROM prop_events WHERE title = 'CIDWECC');

-- 3. Finally remove the event itself
DELETE FROM prop_events 
WHERE title = 'CIDWECC';

-- Verification log
DO $$
BEGIN
    RAISE NOTICE 'Surgical removal of CIDWECC event completed.';
END $$;
