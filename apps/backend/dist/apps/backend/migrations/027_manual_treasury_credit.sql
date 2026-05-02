-- 027_manual_treasury_credit.sql
-- Manual treasury drop for moderator and core team.

DO $$
BEGIN
    -- 1. Credit SaiK (saisrikiran_ipm25@iift.edu) with 1000 Creds
    UPDATE users 
    SET cred_balance = cred_balance + 1000.0,
        updated_at = NOW()
    WHERE email = 'saisrikiran_ipm25@iift.edu';
    
    RAISE NOTICE 'Credited 1000 Creds to saisrikiran_ipm25@iift.edu';

    -- 2. Credit Aarav (aarav_ipm25@iift.edu) with 200 Chips
    UPDATE users 
    SET chip_balance = chip_balance + 200.0,
        updated_at = NOW()
    WHERE email = 'aarav_ipm25@iift.edu';

    RAISE NOTICE 'Credited 200 Chips to aarav_ipm25@iift.edu';

END $$;
