-- 034_ultimate_silo_normalization.sql
-- Goal: Synchronize all legacy silo identifiers to the new Short-Code standard.
-- This fixes the "Deep and Hardcoded" string mismatches across the DB.

DO $$
DECLARE
    inst_rec RECORD;
BEGIN
    -- For every institution, we find users/tickers/rumors that use the old format (e.g. 'iift.edu_delhi')
    -- and migrate them to the new unified short_code (e.g. 'IIFT-D').

    FOR inst_rec IN SELECT institution_id, short_code, email_domain, name FROM institutions LOOP
        
        -- A. Normalize Users
        -- Old format: iift.edu_delhi or raw iift.edu
        UPDATE users 
        SET college_domain = inst_rec.short_code,
            institution_id = inst_rec.institution_id
        WHERE (college_domain = inst_rec.email_domain || '_' || LOWER(SPLIT_PART(inst_rec.name, ' ', 2))
           OR college_domain = inst_rec.email_domain
           OR institution_id = inst_rec.institution_id)
        AND college_domain != inst_rec.short_code;

        -- B. Normalize Tickers
        UPDATE tickers 
        SET college_domain = inst_rec.short_code
        WHERE (college_domain = inst_rec.email_domain || '_' || LOWER(SPLIT_PART(inst_rec.name, ' ', 2))
           OR college_domain = inst_rec.email_domain
           OR owner_id IN (SELECT user_id FROM users WHERE institution_id = inst_rec.institution_id))
        AND college_domain != inst_rec.short_code;

        -- C. Normalize Rumors
        -- Some rumors might still be on the old domain
        UPDATE rumor_posts 
        SET college_domain = inst_rec.short_code
        WHERE (college_domain = inst_rec.email_domain || '_' || LOWER(SPLIT_PART(inst_rec.name, ' ', 2))
           OR college_domain = inst_rec.email_domain
           OR author_id IN (SELECT user_id FROM users WHERE institution_id = inst_rec.institution_id))
        AND college_domain != inst_rec.short_code;

    END LOOP;

    -- D. Safety: Force set IIFT Delhi for any remaining stragglers matching the domain but unmapped
    UPDATE users SET institution_id = (SELECT institution_id FROM institutions WHERE short_code = 'IIFT-D' LIMIT 1), college_domain = 'IIFT-D'
    WHERE college_domain IS NULL AND email LIKE '%iift.edu';
    
    UPDATE tickers SET college_domain = 'IIFT-D'
    WHERE college_domain = 'iift.edu' OR college_domain = 'iift.edu_delhi';

END $$;
