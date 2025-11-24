-- =============================================
-- EMAIL LOGS TABLE
-- Lưu lịch sử gửi email để theo dõi và debug
-- =============================================

-- 1. Tạo bảng email_logs
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Email info
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,

  -- Email type (otp, referral_bonus, referral_completion, voucher_claim, test, etc.)
  email_type VARCHAR(50) NOT NULL DEFAULT 'unknown',

  -- Provider used (resend, gmail)
  provider VARCHAR(20) NOT NULL,

  -- Status (success, failed)
  status VARCHAR(20) NOT NULL DEFAULT 'success',

  -- Provider message ID (nếu có)
  message_id VARCHAR(255),

  -- Error message (nếu gửi thất bại)
  error_message TEXT,

  -- Related user (optional)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Additional metadata (JSON)
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo indexes để query nhanh
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- 3. RLS policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả
CREATE POLICY "Admin can view all email logs" ON email_logs
  FOR SELECT
  USING (true);

-- Service role có thể insert
CREATE POLICY "Service role can insert email logs" ON email_logs
  FOR INSERT
  WITH CHECK (true);

-- 4. Comment cho documentation
COMMENT ON TABLE email_logs IS 'Lưu lịch sử gửi email từ hệ thống';
COMMENT ON COLUMN email_logs.email_type IS 'Loại email: otp, referral_bonus, referral_completion, voucher_claim, test';
COMMENT ON COLUMN email_logs.provider IS 'Provider gửi email: resend hoặc gmail';
COMMENT ON COLUMN email_logs.status IS 'Trạng thái: success hoặc failed';
