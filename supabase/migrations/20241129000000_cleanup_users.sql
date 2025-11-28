-- Migration to clean up ALL data but keep 'congdat192@gmail.com' account

-- 1. Clean up ALL game sessions (wipe clean)
DELETE FROM game_sessions;

-- 2. Clean up ALL reward redemptions (wipe clean)
DELETE FROM reward_redemptions;

-- 3. Clean up ALL referrals (wipe clean)
DELETE FROM referrals;

-- 4. Clean up ALL otp codes
DELETE FROM otp_codes;

-- 5. Clean up users EXCEPT 'congdat192@gmail.com'
DELETE FROM users
WHERE email != 'congdat192@gmail.com' OR email IS NULL;

-- 6. Reset stats for 'congdat192@gmail.com' to start fresh
UPDATE users
SET 
  total_score = 0,
  plays_today = 0,
  bonus_plays = 0,
  last_play_date = NULL
WHERE email = 'congdat192@gmail.com';
