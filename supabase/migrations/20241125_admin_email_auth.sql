-- Add email column to admins table
ALTER TABLE admins ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- Update existing admin with email (assuming only one admin or we update the specific one)
UPDATE admins SET email = 'congdat192@gmail.com' WHERE username = 'admin';

-- Make email required (after update)
-- ALTER TABLE admins ALTER COLUMN email SET NOT NULL; -- Optional, maybe keep it nullable for now if there are other admins

-- Remove password column (optional, keeping it for now just in case, or we can drop it)
-- ALTER TABLE admins DROP COLUMN password;
