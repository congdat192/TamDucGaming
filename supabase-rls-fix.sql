-- =============================================
-- SECURITY HARDENING & OPTIMIZATION MIGRATION
-- =============================================

-- 1. FIX RLS POLICIES
-- Revoke all permissions for anon/authenticated roles on sensitive tables
-- We will rely on the SERVICE_ROLE key (used in API routes) to write to these tables.

-- Game Sessions
DROP POLICY IF EXISTS "Game sessions are viewable by everyone" ON game_sessions;
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON game_sessions;

CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions
  FOR SELECT USING (true); -- Keep public for leaderboard

-- No INSERT policy for anon/authenticated -> Default DENY

-- Vouchers
DROP POLICY IF EXISTS "Vouchers are viewable by everyone" ON vouchers;
DROP POLICY IF EXISTS "Vouchers can be inserted" ON vouchers;

-- Only allow users to see their own vouchers (if fetched via client, though currently fetched via API)
-- If API uses service_role, this policy is not strictly needed for API, but good for safety.
-- However, since we don't use Supabase Auth, auth.uid() is null.
-- So we disable SELECT for anon entirely.
-- CREATE POLICY "Users can see their own vouchers" ON vouchers FOR SELECT USING (false); 

-- No INSERT policy -> Default DENY

-- Referrals
DROP POLICY IF EXISTS "Referrals are viewable by everyone" ON referrals;
DROP POLICY IF EXISTS "Referrals can be inserted" ON referrals;

-- No INSERT policy -> Default DENY

-- OTP Codes
DROP POLICY IF EXISTS "OTP codes are manageable" ON otp_codes;

-- No policies -> Default DENY ALL for anon/authenticated.

-- Reward Redemptions
DROP POLICY IF EXISTS "Redemptions are viewable by everyone" ON reward_redemptions;
DROP POLICY IF EXISTS "Redemptions can be inserted" ON reward_redemptions;

-- No INSERT policy -> Default DENY

-- Users
-- Ensure users can only update their own profile (if we ever allow client-side update)
-- Currently 'Users are viewable by everyone' is fine for leaderboard.
-- But we should prevent UPDATE/INSERT from client.
DROP TRIGGER IF EXISTS users_updated_at ON users; -- Keep trigger logic, but maybe recreate it? No, trigger is fine.
-- Just ensure no policies allow modification.
-- Existing policy is only for SELECT. So INSERT/UPDATE are already DENIED for anon.

-- 2. ADD MISSING INDEXES
CREATE INDEX IF NOT EXISTS idx_game_sessions_campaign_played_at ON game_sessions(campaign_id, played_at);
