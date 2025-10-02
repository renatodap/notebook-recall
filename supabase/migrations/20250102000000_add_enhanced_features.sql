-- Migration for Enhanced Features: Voice, Email Capture, Digests, PWA
-- Run this migration to add support for new features

-- 1. Add audio_url field to sources for voice notes
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS audio_duration integer, -- in seconds
ADD COLUMN IF NOT EXISTS transcript text; -- for voice note transcripts

-- 2. Create email capture tracking table
CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_from text NOT NULL,
  email_subject text,
  email_body text NOT NULL,
  source_id uuid REFERENCES public.sources(id) ON DELETE SET NULL,
  processed boolean DEFAULT false,
  captured_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 3. Create user preferences table for digest settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_frequency text DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'never'
  digest_day integer DEFAULT 1, -- 1 = Monday, 7 = Sunday
  digest_time time DEFAULT '09:00:00',
  digest_enabled boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  capture_email text, -- unique email for forwarding captures
  preferences jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create digest history table
CREATE TABLE IF NOT EXISTS public.digest_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  digest_type text NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start timestamp with time zone NOT NULL,
  period_end timestamp with time zone NOT NULL,
  content text NOT NULL,
  source_count integer DEFAULT 0,
  sent_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sources_audio_url ON public.sources(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_captures_user_id ON public.email_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_processed ON public.email_captures(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_digest_emails_user_id ON public.digest_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_digest_emails_sent_at ON public.digest_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_sources_transcript ON public.sources(transcript) WHERE transcript IS NOT NULL;

-- 6. Add RLS (Row Level Security) policies
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digest_emails ENABLE ROW LEVEL SECURITY;

-- Email captures policies
CREATE POLICY "Users can view their own email captures"
  ON public.email_captures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email captures"
  ON public.email_captures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Digest emails policies
CREATE POLICY "Users can view their own digest emails"
  ON public.digest_emails FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Update sources to support YouTube content_type (if not already)
-- Add YouTube as a valid content type if using enum
-- Note: If content_type is an enum, you may need to alter the type
-- For now, we'll handle it in application logic

-- 8. Create function to generate unique capture email
CREATE OR REPLACE FUNCTION generate_capture_email()
RETURNS text AS $$
DECLARE
  random_str text;
  user_email text;
BEGIN
  -- Generate a random 8-character string
  random_str := substring(md5(random()::text) from 1 for 8);

  -- Return format: capture-{random}@yourdomain.com
  RETURN 'capture-' || random_str || '@recall.app';
END;
$$ LANGUAGE plpgsql;

-- 9. Auto-generate capture email for existing users
-- This runs once and sets up capture emails for users who don't have them
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN SELECT id FROM auth.users LOOP
    INSERT INTO public.user_preferences (user_id, capture_email)
    VALUES (user_record.id, generate_capture_email())
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;

-- 10. Add trigger to auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, capture_email)
  VALUES (NEW.id, generate_capture_email())
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_preferences();

-- 11. Add YouTube metadata to sources
ALTER TABLE public.sources
ADD COLUMN IF NOT EXISTS youtube_id text,
ADD COLUMN IF NOT EXISTS youtube_title text,
ADD COLUMN IF NOT EXISTS youtube_channel text;

CREATE INDEX IF NOT EXISTS idx_sources_youtube_id ON public.sources(youtube_id) WHERE youtube_id IS NOT NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! New features enabled:';
  RAISE NOTICE '  ✓ Voice notes support (audio_url, transcript)';
  RAISE NOTICE '  ✓ Email capture system';
  RAISE NOTICE '  ✓ Digest email preferences';
  RAISE NOTICE '  ✓ YouTube video support';
  RAISE NOTICE '  ✓ All indexes and RLS policies created';
END $$;
