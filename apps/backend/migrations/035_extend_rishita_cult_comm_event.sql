-- 035_extend_rishita_cult_comm_event.sql
-- Goal: Extend the duration of the "Will Rishita become the next Cult Comm Head?" event by 12 hours 20 minutes.
-- This is a surgical update as requested.

UPDATE prop_events
SET expiry_timestamp = expiry_timestamp + INTERVAL '12 hours 20 minutes',
    updated_at = NOW()
WHERE title ILIKE 'Will Rishita become the next Cult Comm Head?'
   OR title ILIKE '%Rishita%Cult Comm%';
