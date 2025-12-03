-- Santa Jump: Ad System Migration
-- Created: 2025-12-03
-- Description: Create tables for multi-placement advertising system

-- 1. Ad Placements Table
CREATE TABLE IF NOT EXISTS ad_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ad Contents Table
CREATE TABLE IF NOT EXISTS ad_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  placement_id UUID REFERENCES ad_placements(id) ON DELETE CASCADE,
  sponsor_name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  link_url TEXT,
  display_text TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ad Impressions Table (Analytics)
CREATE TABLE IF NOT EXISTS ad_impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_content_id UUID REFERENCES ad_contents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  placement_key TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ad_contents_placement ON ad_contents(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_contents_active ON ad_contents(is_active);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_ad_content ON ad_impressions(ad_content_id);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_created_at ON ad_impressions(created_at);
CREATE INDEX IF NOT EXISTS idx_ad_impressions_placement ON ad_impressions(placement_key);

-- Insert default placements
INSERT INTO ad_placements (placement_key, title, description, display_order, is_enabled) VALUES
  ('ground_banner', 'Banner Trên Ground', 'Logo hiển thị trên ground trong game (xen kẽ mỗi 3s)', 1, TRUE),
  ('loading_screen', 'Loading Screen', 'Logo full screen khi loading game (2-3s)', 2, TRUE),
  ('game_over', 'Game Over Screen', 'Quảng cáo hiển thị khi game over', 3, TRUE),
  ('leaderboard', 'Leaderboard Sponsor', 'Logo tài trợ trên bảng xếp hạng', 4, TRUE),
  ('voucher_redemption', 'Voucher Redemption', 'Quảng cáo khi đổi voucher', 5, TRUE)
ON CONFLICT (placement_key) DO NOTHING;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ad_placements_updated_at
  BEFORE UPDATE ON ad_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_contents_updated_at
  BEFORE UPDATE ON ad_contents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE ad_placements IS 'Defines available ad placement positions in the game';
COMMENT ON TABLE ad_contents IS 'Stores actual ad content (logos, text) for each placement';
COMMENT ON TABLE ad_impressions IS 'Tracks ad views for analytics';
COMMENT ON COLUMN ad_contents.logo_url IS 'Path to uploaded logo file in /public/ads/';
COMMENT ON COLUMN ad_contents.display_text IS 'Optional text like "Tài trợ bởi..." or CTA';
COMMENT ON COLUMN ad_impressions.session_id IS 'Game session ID for tracking unique views';
