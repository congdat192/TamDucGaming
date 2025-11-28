-- Add challenge field to game_sessions for HMAC payload signing
-- This field stores a server-generated random challenge used to sign game payloads

ALTER TABLE public.game_sessions
ADD COLUMN IF NOT EXISTS challenge TEXT;

-- Add comment
COMMENT ON COLUMN public.game_sessions.challenge IS 'Server-generated challenge for HMAC payload signing (anti-cheat)';
