-- Migration: Security Hardening (RLS)
-- Date: 2024-11-29
-- Purpose: Enforce strict RLS policies to prevent unauthorized access.
--          Only Service Role (API) can write data.
--          Users can only read their own data.

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to ensure clean slate
-- Users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for all users" ON public.users;

-- Game Sessions
DROP POLICY IF EXISTS "Game sessions are viewable by everyone" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Game sessions viewable by owner" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Service role can manage game sessions" ON public.game_sessions;

-- Reward Redemptions (Vouchers)
DROP POLICY IF EXISTS "Users can view own redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Service role can manage redemptions" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.reward_redemptions;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.reward_redemptions;

-- Referrals
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Service role can manage referrals" ON public.referrals;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.referrals;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.referrals;

-- OTP Codes
DROP POLICY IF EXISTS "Service role can manage otp codes" ON public.otp_codes;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.otp_codes;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.otp_codes;

-- Rewards
DROP POLICY IF EXISTS "Service role can manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.rewards;

-- Campaigns
DROP POLICY IF EXISTS "Service role can manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.campaigns;


-- 3. Create STRICT Policies

-- ==========================================
-- TABLE: users
-- ==========================================
-- SELECT: Users can see their own profile OR Service Role
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (
    auth.uid()::text = id OR
    auth.role() = 'service_role'
  );

-- INSERT/UPDATE/DELETE: Only Service Role (API)
CREATE POLICY "Service role can manage users" ON public.users
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: game_sessions
-- ==========================================
-- SELECT: Users can see their own sessions OR Service Role
CREATE POLICY "Users can view own game sessions" ON public.game_sessions
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- INSERT/UPDATE/DELETE: Only Service Role (API)
CREATE POLICY "Service role can manage game sessions" ON public.game_sessions
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: reward_redemptions
-- ==========================================
-- SELECT: Users can see their own redemptions OR Service Role
CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (
    auth.uid()::text = user_id OR
    auth.role() = 'service_role'
  );

-- INSERT/UPDATE/DELETE: Only Service Role (API)
CREATE POLICY "Service role can manage redemptions" ON public.reward_redemptions
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: referrals
-- ==========================================
-- SELECT: Users can see their own referrals (as referrer) OR Service Role
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (
    auth.uid()::text = referrer_id OR
    auth.role() = 'service_role'
  );

-- INSERT/UPDATE/DELETE: Only Service Role (API)
CREATE POLICY "Service role can manage referrals" ON public.referrals
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: otp_codes
-- ==========================================
-- ALL: Only Service Role (API)
CREATE POLICY "Service role can manage otp codes" ON public.otp_codes
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: rewards
-- ==========================================
-- ALL: Only Service Role (API)
CREATE POLICY "Service role can manage rewards" ON public.rewards
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- ==========================================
-- TABLE: campaigns
-- ==========================================
-- ALL: Only Service Role (API)
CREATE POLICY "Service role can manage campaigns" ON public.campaigns
  FOR ALL USING (
    auth.role() = 'service_role'
  );
