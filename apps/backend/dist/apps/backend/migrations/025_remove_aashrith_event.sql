-- 025_remove_aashrith_event.sql
-- Surgical removal of the 'Aashrith' test event and its associated financial artifacts.

DO $$
DECLARE
    target_event_id UUID;
BEGIN
    -- 1. Identify the event ID surgically based on the exact title fragment
    SELECT event_id INTO target_event_id 
    FROM prop_events 
    WHERE title ILIKE '%Will Aashrith beat Karunya to become the next HMC Head%'
    LIMIT 1;

    IF target_event_id IS NOT NULL THEN
        -- 2. Cleanup dependent transactions (Bet logs)
        DELETE FROM transactions WHERE prop_event_id = target_event_id;
        
        -- 3. Cleanup dependent bets (Pari-mutuel artifacts)
        DELETE FROM prop_bets WHERE event_id = target_event_id;
        
        -- 4. Finally, remove the event from the Arena
        DELETE FROM prop_events WHERE event_id = target_event_id;
        
        RAISE NOTICE 'Surgical removal of event % (Aashrith) completed successfully.', target_event_id;
    ELSE
        RAISE NOTICE 'Target event not found. No action taken.';
    END IF;
END $$;
