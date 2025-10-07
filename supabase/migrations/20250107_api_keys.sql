-- API Keys for External Integrations
-- This migration adds support for API key authentication

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE, -- Hashed API key
  key_prefix TEXT NOT NULL, -- First 8 characters for display
  name TEXT NOT NULL, -- User-friendly name for the key
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- Optional expiration
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{"read": true, "write": false}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash) WHERE is_active = true;
CREATE INDEX idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE is_active = true;

-- RLS Policies
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- Function to clean up expired API keys
CREATE OR REPLACE FUNCTION cleanup_expired_api_keys()
RETURNS void AS $$
BEGIN
  UPDATE public.api_keys
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.api_keys IS 'API keys for external integrations (e.g., Persimmon Labs)';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the API key for secure storage';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 8 characters of key for display purposes';
COMMENT ON COLUMN public.api_keys.permissions IS 'JSON object defining read/write permissions';
