-- Drop Academy.email column: email is now always sourced from User.email via ownerId JOIN
ALTER TABLE Academy DROP COLUMN email;
