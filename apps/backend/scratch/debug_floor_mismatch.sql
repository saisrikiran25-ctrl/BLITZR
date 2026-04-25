-- Audit script to check for domain mismatches
SELECT 
    ticker_id, 
    college_domain as ticker_domain, 
    u.username as owner,
    i.short_code as owner_campus_code,
    i.email_domain as owner_inst_domain
FROM tickers t
JOIN users u ON t.owner_id = u.user_id
JOIN institutions i ON u.institution_id = i.institution_id;
