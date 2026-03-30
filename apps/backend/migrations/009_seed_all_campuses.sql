-- 009_seed_all_campuses.sql

-- 1. Remove the incorrect UNIQUE constraint on email_domain
ALTER TABLE institutions DROP CONSTRAINT IF EXISTS institutions_email_domain_key;

-- 2. Add a new UNIQUE constraint on (email_domain, name) for precision
ALTER TABLE institutions ADD CONSTRAINT uq_campus_name UNIQUE (email_domain, name);

-- 3. Seed additional IIFT campuses
INSERT INTO institutions (name, short_code, email_domain, city, verified)
VALUES 
('IIFT Kolkata', 'IIFT-K', 'iift.edu', 'Kolkata', TRUE),
('IIFT Kakinada', 'IIFT-KK', 'iift.edu', 'Kakinada', TRUE)
ON CONFLICT (email_domain, name) DO NOTHING;

-- 4. Seed some other multi-campus ones for completeness
INSERT INTO institutions (name, short_code, email_domain, city, verified)
VALUES 
('BITS Pilani', 'BITS-PILANI', 'bits-pilani.ac.in', 'Pilani', TRUE),
('BITS Goa', 'BITS-GOA', 'bits-pilani.ac.in', 'Goa', TRUE),
('BITS Hyderabad', 'BITS-HYD', 'bits-pilani.ac.in', 'Hyderabad', TRUE),
('VIT Vellore', 'VIT-VELLORE', 'vit.ac.in', 'Vellore', TRUE),
('VIT Chennai', 'VIT-CHENNAI', 'vit.ac.in', 'Chennai', TRUE)
ON CONFLICT (email_domain, name) DO NOTHING;
