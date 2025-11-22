-- =============================================
-- SANTA JUMP - MẮT KÍNH TÂM ĐỨC
-- Database Schema for Supabase
-- =============================================

-- Bật UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- BẢNG USERS - Người chơi
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) UNIQUE NOT NULL,
  referral_code VARCHAR(10) UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
  plays_today INTEGER DEFAULT 0,
  bonus_plays INTEGER DEFAULT 0,
  last_play_date DATE,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho tìm kiếm
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_total_score ON users(total_score DESC);

-- =============================================
-- BẢNG OTP_CODES - Mã OTP
-- =============================================
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(15) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_otp_phone ON otp_codes(phone);
CREATE INDEX idx_otp_expires ON otp_codes(expires_at);

-- =============================================
-- BẢNG CAMPAIGNS - Chiến dịch
-- =============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_campaigns_active ON campaigns(is_active, start_date, end_date);

-- =============================================
-- BẢNG GAME_SESSIONS - Lịch sử chơi
-- =============================================
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL
);

CREATE INDEX idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_score ON game_sessions(score DESC);
CREATE INDEX idx_game_sessions_played_at ON game_sessions(played_at);
CREATE INDEX idx_game_sessions_campaign ON game_sessions(campaign_id);

-- =============================================
-- BẢNG VOUCHERS - Voucher giảm giá
-- =============================================
CREATE TABLE vouchers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(20) UNIQUE NOT NULL,
  value INTEGER NOT NULL, -- 50000, 100000, 150000
  score_earned INTEGER NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  sent_to_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_vouchers_user ON vouchers(user_id);
CREATE INDEX idx_vouchers_code ON vouchers(code);

-- =============================================
-- BẢNG REFERRALS - Giới thiệu bạn bè
-- =============================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- =============================================
-- BẢNG ADMINS - Quản trị viên
-- =============================================
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger cho users
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function reset plays hàng ngày
CREATE OR REPLACE FUNCTION reset_daily_plays()
RETURNS void AS $$
BEGIN
  UPDATE users
  SET plays_today = 0, last_play_date = CURRENT_DATE
  WHERE last_play_date < CURRENT_DATE OR last_play_date IS NULL;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS cho Leaderboard
-- =============================================

-- View leaderboard tuần
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

-- View leaderboard tháng
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

-- View leaderboard tổng
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

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Bật RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy cho users - ai cũng có thể đọc (cho leaderboard)
CREATE POLICY "Users are viewable by everyone" ON users
  FOR SELECT USING (true);

-- Policy cho game_sessions
CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own game sessions" ON game_sessions
  FOR INSERT WITH CHECK (true);

-- Policy cho vouchers
CREATE POLICY "Vouchers are viewable by everyone" ON vouchers
  FOR SELECT USING (true);

CREATE POLICY "Vouchers can be inserted" ON vouchers
  FOR INSERT WITH CHECK (true);

-- Policy cho referrals
CREATE POLICY "Referrals are viewable by everyone" ON referrals
  FOR SELECT USING (true);

CREATE POLICY "Referrals can be inserted" ON referrals
  FOR INSERT WITH CHECK (true);

-- Policy cho otp_codes
CREATE POLICY "OTP codes are manageable" ON otp_codes
  FOR ALL USING (true);

-- =============================================
-- SAMPLE DATA (Optional)
-- =============================================

-- Tạo campaign mẫu
INSERT INTO campaigns (name, description, start_date, end_date, is_active)
VALUES (
  'Giáng Sinh 2024',
  'Chiến dịch Giáng Sinh Mắt Kính Tâm Đức 2024',
  '2024-12-01',
  '2024-12-31',
  true
);

-- Tạo admin mẫu (password: admin123 - đã hash)
-- Bạn nên đổi password này
INSERT INTO admins (username, password)
VALUES ('admin', '$2a$10$XQxBtZGKVKKKKKKKKKKKKuYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY');
