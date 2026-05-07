-- Allow academies to restrict student signups to specific email domains.
-- Stored as a comma-separated lowercased list of domains (e.g. "myuax.com,myuax.es").
-- NULL or empty = no restriction.
ALTER TABLE Academy ADD COLUMN allowedEmailDomains TEXT DEFAULT NULL;
