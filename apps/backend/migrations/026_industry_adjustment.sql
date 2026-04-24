-- 026_industry_adjustment.sql
-- Administrative adjustment of Arena events as per moderator instructions.

DO $$
BEGIN
    -- 1. Extend "Aashrith" event by 60 hours
    UPDATE prop_events 
    SET expiry_timestamp = expiry_timestamp + interval '60 hours',
        updated_at = NOW()
    WHERE title ILIKE '%Can Aashrith beat Karunya%' AND status = 'OPEN';
    
    RAISE NOTICE 'Extended Aashrith event duration by 60 hours.';

    -- 2. End "Shaurya" event immediately
    UPDATE prop_events 
    SET expiry_timestamp = NOW() - interval '1 minute',
        updated_at = NOW()
    WHERE title ILIKE '%Will Shaurya attend this class%' AND status = 'OPEN';

    RAISE NOTICE 'Expired Shaurya event for immediate settlement.';

END $$;
