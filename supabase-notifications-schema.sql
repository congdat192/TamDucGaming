-- =============================================
-- NOTIFICATIONS SYSTEM
-- Schema cho hệ thống thông báo
-- Script an toàn - có thể chạy nhiều lần
-- =============================================

-- Bảng notifications (chỉ tạo nếu chưa tồn tại)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index (chỉ tạo nếu chưa tồn tại)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Bật RLS (an toàn nếu đã bật)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop policies cũ nếu tồn tại, rồi tạo mới
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Notifications can be inserted" ON notifications;
DROP POLICY IF EXISTS "Notifications can be updated" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (true);

CREATE POLICY "Notifications can be inserted" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Notifications can be updated" ON notifications
  FOR UPDATE USING (true);

-- Function cleanup (replace nếu đã tồn tại)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Enable Realtime (bỏ qua lỗi nếu đã enable)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Table notifications already in publication';
END;
$$;

-- =============================================
-- Chạy script này trong Supabase SQL Editor
-- =============================================
