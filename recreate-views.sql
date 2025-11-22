-- =============================================
-- RECREATE LEADERBOARD VIEWS
-- Run this script in Supabase SQL Editor to ensure views exist
-- =============================================

-- 1. View leaderboard tuần
DROP VIEW IF EXISTS leaderboard_weekly;
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  u.id,
  u.phone,
  u.referral_code,
  COALESCE(SUM(gs.score), 0) as weekly_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
  AND gs.played_at >= DATE_TRUNC('week', NOW())
GROUP BY u.id, u.phone, u.referral_code
ORDER BY weekly_score DESC;

-- 2. View leaderboard tháng
DROP VIEW IF EXISTS leaderboard_monthly;
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT
  u.id,
  u.phone,
  u.referral_code,
  COALESCE(SUM(gs.score), 0) as monthly_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
  AND gs.played_at >= DATE_TRUNC('month', NOW())
GROUP BY u.id, u.phone, u.referral_code
ORDER BY monthly_score DESC;

-- 3. View leaderboard tổng
DROP VIEW IF EXISTS leaderboard_all_time;
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  u.id,
  u.phone,
  u.referral_code,
  u.total_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.phone, u.referral_code, u.total_score
ORDER BY u.total_score DESC;
