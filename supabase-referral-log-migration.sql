-- =============================================
-- MIGRATION: PLAY LOGS & BONUS TRANSACTION
-- =============================================

-- 1. Create play_logs table
CREATE TABLE IF NOT EXISTS play_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Positive for bonus, negative for play
  reason VARCHAR(50) NOT NULL, -- 'phone_update', 'referral_bonus', 'game_play', 'daily_reset'
  related_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- For referral bonuses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_play_logs_user ON play_logs(user_id);
CREATE INDEX idx_play_logs_created_at ON play_logs(created_at DESC);

-- Enable RLS
ALTER TABLE play_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own logs
CREATE POLICY "Users can view their own play logs" ON play_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Create RPC function to add bonus plays transactionally
CREATE OR REPLACE FUNCTION add_bonus_plays(
  target_user_id UUID,
  bonus_amount INTEGER,
  reason_text VARCHAR,
  related_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
  current_bonus INTEGER;
  new_total INTEGER;
BEGIN
  -- Get current bonus plays
  SELECT bonus_plays INTO current_bonus FROM users WHERE id = target_user_id;
  
  -- Update user's bonus plays
  UPDATE users
  SET bonus_plays = COALESCE(bonus_plays, 0) + bonus_amount,
      updated_at = NOW()
  WHERE id = target_user_id;
  
  -- Insert log
  INSERT INTO play_logs (user_id, amount, reason, related_user_id)
  VALUES (target_user_id, bonus_amount, reason_text, related_id);
  
  -- Return new total bonus plays
  RETURN COALESCE(current_bonus, 0) + bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
