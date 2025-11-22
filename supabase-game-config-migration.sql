-- Game Config Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS game_config (
  id TEXT PRIMARY KEY DEFAULT 'main',
  config_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default config
INSERT INTO game_config (id, config_data) VALUES (
  'main',
  '{
    "maxPlaysPerDay": 1,
    "bonusPlaysForPhone": 3,
    "bonusPlaysForReferral": 1,
    "voucherTiers": [
      {"minScore": 30, "value": 150000, "label": "150K"},
      {"minScore": 20, "value": 100000, "label": "100K"},
      {"minScore": 10, "value": 50000, "label": "50K"}
    ],
    "testEmails": ["test@test.com", "admin@matkinhtamduc.com", "congdat192@gmail.com"],
    "testPhones": ["0909999999", "0123456789"]
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE game_config ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read for all
CREATE POLICY "Allow public read" ON game_config
  FOR SELECT USING (true);

-- Policy: Allow insert/update/delete for all (admin API handles auth)
CREATE POLICY "Allow all writes" ON game_config
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all updates" ON game_config
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all deletes" ON game_config
  FOR DELETE USING (true);

-- ========================================
-- FIX: Nếu đã chạy migration trước đó, chạy lệnh này để sửa policy:
-- ========================================
-- DROP POLICY IF EXISTS "Service role can update" ON game_config;
-- DROP POLICY IF EXISTS "Allow public read" ON game_config;
-- CREATE POLICY "Allow public read" ON game_config FOR SELECT USING (true);
-- CREATE POLICY "Allow all writes" ON game_config FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow all updates" ON game_config FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow all deletes" ON game_config FOR DELETE USING (true);
