-- Migration: Enhanced game_sessions table for server-side validation (SAFE VERSION)
-- Date: 2025-01-27
-- Purpose: Chống gian lận bằng cách validate score phía server

-- Add new columns for enhanced anti-cheat (IF NOT EXISTS is safe)
ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS game_token text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'started',
ADD COLUMN IF NOT EXISTS start_time timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS end_time timestamptz,
ADD COLUMN IF NOT EXISTS client_score int,
ADD COLUMN IF NOT EXISTS validated_score int,
ADD COLUMN IF NOT EXISTS client_duration_seconds int,
ADD COLUMN IF NOT EXISTS config_snapshot jsonb,
ADD COLUMN IF NOT EXISTS ip_hash text,
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS suspicion_reason text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add UNIQUE constraint for game_token if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_sessions_game_token_key'
  ) THEN
    ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_game_token_key UNIQUE (game_token);
  END IF;
END $$;

-- Migrate old score column to client_score/validated_score
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'game_sessions'
    AND column_name = 'score'
    AND table_schema = 'public'
  ) THEN
    -- Copy score to client_score and validated_score for historical data
    UPDATE public.game_sessions
    SET client_score = score,
        validated_score = score,
        status = 'finished'
    WHERE client_score IS NULL AND score IS NOT NULL;
  END IF;
END $$;

-- Create indexes for performance (IF NOT EXISTS is safe)
CREATE INDEX IF NOT EXISTS game_sessions_game_token_idx ON public.game_sessions(game_token);
CREATE INDEX IF NOT EXISTS game_sessions_status_idx ON public.game_sessions(status);
CREATE INDEX IF NOT EXISTS game_sessions_start_time_idx ON public.game_sessions(start_time);
CREATE INDEX IF NOT EXISTS game_sessions_suspicion_idx ON public.game_sessions(suspicion_reason) WHERE suspicion_reason IS NOT NULL;

-- Add constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'game_sessions_status_check'
  ) THEN
    ALTER TABLE public.game_sessions
    ADD CONSTRAINT game_sessions_status_check
    CHECK (status IN ('started', 'finished', 'invalid', 'processing'));
  END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating timestamp
DROP TRIGGER IF EXISTS game_sessions_updated_at ON public.game_sessions;
CREATE TRIGGER game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_game_session_timestamp();

-- RLS Policies - Drop ALL old policies first
DROP POLICY IF EXISTS "Game sessions are viewable by everyone" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can insert their own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Game sessions viewable by owner" ON public.game_sessions;
DROP POLICY IF EXISTS "Users can view own game sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Service role can manage game sessions" ON public.game_sessions;

-- Recreate policies
CREATE POLICY "Users can view own game sessions" ON public.game_sessions
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage game sessions" ON public.game_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Create or replace view for leaderboard (uses validated_score only)
DROP VIEW IF EXISTS public.leaderboard_view;
CREATE VIEW public.leaderboard_view AS
SELECT
  u.id,
  u.phone,
  u.email,
  u.name,
  COALESCE(SUM(gs.validated_score), 0) as total_validated_score,
  COUNT(gs.id) as games_played
FROM public.users u
LEFT JOIN public.game_sessions gs
  ON u.id = gs.user_id
  AND gs.status = 'finished'
GROUP BY u.id, u.phone, u.email, u.name
ORDER BY total_validated_score DESC;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_view TO anon, authenticated;

-- Add comments
COMMENT ON TABLE public.game_sessions IS 'Game sessions với server-side validation. client_score = client gửi, validated_score = server đã verify';
COMMENT ON COLUMN public.game_sessions.game_token IS 'Token duy nhất do server tạo khi bắt đầu game';
COMMENT ON COLUMN public.game_sessions.status IS 'started = đang chơi, processing = đang xử lý, finished = đã hoàn thành, invalid = bị đánh dấu gian lận';
COMMENT ON COLUMN public.game_sessions.client_score IS 'Điểm client gửi lên (chưa validate)';
COMMENT ON COLUMN public.game_sessions.validated_score IS 'Điểm đã được server validate (dùng cho leaderboard/voucher)';
COMMENT ON COLUMN public.game_sessions.config_snapshot IS 'Snapshot config game lúc bắt đầu (để validate sau)';
COMMENT ON COLUMN public.game_sessions.suspicion_reason IS 'Lý do nghi vấn gian lận nếu có';
