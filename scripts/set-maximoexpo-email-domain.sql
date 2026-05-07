-- Restrict maximoexpo academy to only allow @myuax student signups.
-- Run after migration 0020_academy_email_domain.sql
-- Adjust the academy name match if needed.

UPDATE Academy
SET allowedEmailDomains = 'myuax.com'
WHERE LOWER(name) LIKE '%maximo%expo%' OR LOWER(name) LIKE '%maximoexpo%';

-- Verify:
SELECT id, name, allowedEmailDomains FROM Academy WHERE allowedEmailDomains IS NOT NULL;
