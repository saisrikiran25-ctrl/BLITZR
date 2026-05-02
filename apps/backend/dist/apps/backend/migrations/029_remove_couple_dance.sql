-- ============================================================
-- BLITZR-PRIME: Arena Cleanup
-- Migration: 029_remove_couple_dance
-- Description: surgically remove the specified event and its associated bets.
-- ============================================================

DO $$
DECLARE
    target_event_id UUID;
BEGIN
    -- Get the ID of the event
    SELECT event_id INTO target_event_id 
    FROM prop_events 
    WHERE title = 'Will there be a couple dance at Abhivyakti?';

    IF target_event_id IS NOT NULL THEN
        -- 1. Remove associated bets
        DELETE FROM prop_bets WHERE event_id = target_event_id;
        
        -- 2. Remove associated transactions (if any)
        UPDATE transactions SET prop_event_id = NULL WHERE prop_event_id = target_event_id;
        
        -- 3. Remove the event itself
        DELETE FROM prop_events WHERE event_id = target_event_id;
        
        RAISE NOTICE 'Surgically removed arena event and its bets.';
    ELSE
        RAISE NOTICE 'Target event not found. Skipping.';
    END IF;
END $$;
