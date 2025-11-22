-- =============================================
-- SANTA JUMP - EMAIL LOGIN MIGRATION
-- Chạy SQL này trên Supabase để hỗ trợ đăng nhập bằng email
-- =============================================

-- 1. Thêm cột email vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;

-- Cho phép phone có thể null (vì user có thể đăng nhập bằng email)
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Tạo index cho email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Thêm cột email vào bảng otp_codes
ALTER TABLE otp_codes ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Cho phép phone có thể null trong otp_codes (vì có thể gửi OTP qua email)
ALTER TABLE otp_codes ALTER COLUMN phone DROP NOT NULL;

-- Tạo index cho email trong otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);

-- 3. Cập nhật RLS policy cho users (cho phép INSERT và UPDATE)
-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Users can be created" ON users;
DROP POLICY IF EXISTS "Users can be updated" ON users;

-- Tạo policy mới
CREATE POLICY "Users can be created" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can be updated" ON users
  FOR UPDATE USING (true);

-- 4. Cập nhật views cho leaderboard để hiển thị cả email
DROP VIEW IF EXISTS leaderboard_weekly;
DROP VIEW IF EXISTS leaderboard_monthly;
DROP VIEW IF EXISTS leaderboard_all_time;

-- View leaderboard tuần
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  u.id,
  u.phone,
  u.email,
  u.referral_code,
  COALESCE(SUM(gs.score), 0) as weekly_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
  AND gs.played_at >= DATE_TRUNC('week', NOW())
GROUP BY u.id, u.phone, u.email, u.referral_code
ORDER BY weekly_score DESC;

-- View leaderboard tháng
CREATE OR REPLACE VIEW leaderboard_monthly AS
SELECT
  u.id,
  u.phone,
  u.email,
  u.referral_code,
  COALESCE(SUM(gs.score), 0) as monthly_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
  AND gs.played_at >= DATE_TRUNC('month', NOW())
GROUP BY u.id, u.phone, u.email, u.referral_code
ORDER BY monthly_score DESC;

-- View leaderboard tổng
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  u.id,
  u.phone,
  u.email,
  u.referral_code,
  u.total_score,
  COUNT(gs.id) as games_played
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.phone, u.email, u.referral_code, u.total_score
ORDER BY u.total_score DESC;

-- =============================================
-- DONE! Bây giờ có thể đăng nhập bằng email
-- =============================================
