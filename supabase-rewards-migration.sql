-- =============================================
-- SANTA JUMP - REWARDS & PROFILE MIGRATION
-- Chạy SQL này trên Supabase để hỗ trợ tính năng profile và đổi quà
-- =============================================

-- 1. Thêm cột name vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- 2. Tạo bảng rewards - Danh sách quà tặng
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'voucher', -- 'voucher' hoặc 'gift'
  value INTEGER DEFAULT 0, -- Giá trị voucher (VND)
  points_required INTEGER NOT NULL, -- Điểm cần để đổi
  image_url TEXT,
  stock INTEGER DEFAULT 0, -- Số lượng còn lại
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho rewards
CREATE INDEX IF NOT EXISTS idx_rewards_active ON rewards(is_active, points_required);

-- 3. Tạo bảng reward_redemptions - Lịch sử đổi quà
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_used INTEGER NOT NULL,
  code VARCHAR(50), -- Mã voucher (nếu là voucher)
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  note TEXT, -- Ghi chú cho admin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho reward_redemptions
CREATE INDEX IF NOT EXISTS idx_redemptions_user ON reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_reward ON reward_redemptions(reward_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_status ON reward_redemptions(status);

-- 4. RLS Policies cho rewards
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rewards are viewable by everyone" ON rewards
  FOR SELECT USING (true);

-- 5. RLS Policies cho reward_redemptions
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Redemptions are viewable by everyone" ON reward_redemptions
  FOR SELECT USING (true);

CREATE POLICY "Redemptions can be inserted" ON reward_redemptions
  FOR INSERT WITH CHECK (true);

-- 6. Sample rewards data (tuỳ chọn)
INSERT INTO rewards (name, description, type, value, points_required, stock, is_active) VALUES
  ('Voucher 50.000đ', 'Voucher giảm giá 50.000đ khi mua kính tại Mắt Kính Tâm Đức', 'voucher', 50000, 50, 100, true),
  ('Voucher 100.000đ', 'Voucher giảm giá 100.000đ khi mua kính tại Mắt Kính Tâm Đức', 'voucher', 100000, 100, 50, true),
  ('Voucher 200.000đ', 'Voucher giảm giá 200.000đ khi mua kính tại Mắt Kính Tâm Đức', 'voucher', 200000, 200, 30, true),
  ('Móc khóa Santa', 'Móc khóa hình ông già Noel phiên bản giới hạn', 'gift', 0, 30, 50, true),
  ('Túi vải Giáng Sinh', 'Túi vải canvas in hình Giáng Sinh xinh xắn', 'gift', 0, 80, 30, true),
  ('Gấu bông Noel', 'Gấu bông ông già Noel size 20cm', 'gift', 0, 150, 20, true);

-- =============================================
-- DONE! Bây giờ có thể sử dụng tính năng profile và đổi quà
-- =============================================
