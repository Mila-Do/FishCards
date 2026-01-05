-- Create token blacklist table for Bearer token revocation
-- This table tracks revoked tokens to prevent their reuse

CREATE TABLE IF NOT EXISTS public.token_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_jti TEXT NOT NULL UNIQUE, -- JWT ID from token payload
  token_hash TEXT NOT NULL, -- Hash of the full token for additional security
  reason TEXT DEFAULT 'manual_logout', -- Reason for revocation
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL, -- When the original token would expire
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Add constraints
  CONSTRAINT token_blacklist_reason_check 
    CHECK (reason IN ('manual_logout', 'security_incident', 'password_change', 'admin_revoke'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_blacklist_token_jti ON public.token_blacklist(token_jti);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_user_id ON public.token_blacklist(user_id);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires_at ON public.token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_revoked_at ON public.token_blacklist(revoked_at);

-- Enable RLS
ALTER TABLE public.token_blacklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own revoked tokens
CREATE POLICY "Users can view own revoked tokens" ON public.token_blacklist
  FOR SELECT USING (auth.uid() = user_id);

-- Only authenticated users can insert (for logout)
CREATE POLICY "Users can revoke own tokens" ON public.token_blacklist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to cleanup expired blacklist entries
CREATE OR REPLACE FUNCTION cleanup_expired_blacklist_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete tokens that have expired more than 7 days ago
  DELETE FROM public.token_blacklist 
  WHERE expires_at < NOW() - INTERVAL '7 days';
  
  -- Log cleanup action
  RAISE NOTICE 'Cleaned up expired blacklist tokens at %', NOW();
END;
$$;

-- Create scheduled cleanup (runs daily at 2 AM)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('cleanup-blacklist', '0 2 * * *', 'SELECT cleanup_expired_blacklist_tokens();');

-- Function to revoke a token
CREATE OR REPLACE FUNCTION revoke_token(
  p_token_jti TEXT,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ,
  p_reason TEXT DEFAULT 'manual_logout'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate reason
  IF p_reason NOT IN ('manual_logout', 'security_incident', 'password_change', 'admin_revoke') THEN
    RAISE EXCEPTION 'Invalid revocation reason: %', p_reason;
  END IF;

  -- Insert revocation record
  INSERT INTO public.token_blacklist (
    user_id,
    token_jti,
    token_hash,
    reason,
    expires_at
  ) VALUES (
    auth.uid(),
    p_token_jti,
    p_token_hash,
    p_reason,
    p_expires_at
  )
  ON CONFLICT (token_jti) DO NOTHING; -- Prevent duplicate revocations
  
  -- Log revocation
  RAISE NOTICE 'Token revoked for user % with reason: %', auth.uid(), p_reason;
END;
$$;

-- Function to check if token is revoked
CREATE OR REPLACE FUNCTION is_token_revoked(p_token_jti TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  revoked_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO revoked_count
  FROM public.token_blacklist
  WHERE token_jti = p_token_jti
    AND expires_at > NOW(); -- Only check non-expired blacklist entries
  
  RETURN revoked_count > 0;
END;
$$;

-- Grant necessary permissions
GRANT SELECT, INSERT ON public.token_blacklist TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_token(TEXT, TEXT, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_token_revoked(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_blacklist_tokens() TO postgres;

-- Add comment for documentation
COMMENT ON TABLE public.token_blacklist IS 'Stores revoked JWT tokens to prevent reuse. Tokens are identified by their JTI claim and additional hash verification.';
COMMENT ON FUNCTION revoke_token IS 'Revokes a JWT token by adding it to the blacklist with specified reason';
COMMENT ON FUNCTION is_token_revoked IS 'Checks if a JWT token has been revoked by looking up its JTI in the blacklist';
COMMENT ON FUNCTION cleanup_expired_blacklist_tokens IS 'Removes expired blacklist entries to keep the table size manageable';