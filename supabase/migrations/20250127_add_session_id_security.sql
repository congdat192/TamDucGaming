-- Add session_id to game_sessions table for anti-cheat
-- This prevents replay attacks by tracking unique game sessions

-- Step 1: Add session_id column (nullable first for existing data)
ALTER TABLE game_sessions
ADD COLUMN session_id TEXT;

-- Step 2: Create unique index on session_id (after migration completes)
-- Uncomment this after running the migration and setting session_id for existing records
-- CREATE UNIQUE INDEX idx_game_sessions_session_id ON game_sessions(session_id);

-- Step 3: Make session_id NOT NULL (after all existing records have session_id)
-- Uncomment this after backfilling existing records
-- ALTER TABLE game_sessions
-- ALTER COLUMN session_id SET NOT NULL;

-- NOTE: For existing records without session_id, you can backfill with:
-- UPDATE game_sessions SET session_id = gen_random_uuid()::text WHERE session_id IS NULL;
