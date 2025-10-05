-- Add smart chat columns to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS preferred_persona text DEFAULT 'balanced',
ADD COLUMN IF NOT EXISTS interaction_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_detail_level text DEFAULT 'moderate',
ADD COLUMN IF NOT EXISTS chat_preferences jsonb DEFAULT '{}'::jsonb;

-- Create message_feedback table for adaptive learning
CREATE TABLE IF NOT EXISTS public.message_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  message_id text NOT NULL,
  was_helpful boolean NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  feedback_text text,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key only if table was just created
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'message_feedback_user_id_fkey'
  ) THEN
    ALTER TABLE public.message_feedback
    ADD CONSTRAINT message_feedback_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create proactive_insights table
CREATE TABLE IF NOT EXISTS public.proactive_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  insight_type text NOT NULL,
  message text NOT NULL,
  source_ids uuid[] DEFAULT '{}',
  confidence numeric DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  shown_to_user boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'proactive_insights_user_id_fkey'
  ) THEN
    ALTER TABLE public.proactive_insights
    ADD CONSTRAINT proactive_insights_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create reasoning_steps table
CREATE TABLE IF NOT EXISTS public.reasoning_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  message_index integer NOT NULL,
  step_number integer NOT NULL,
  thought text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create function_calls table
CREATE TABLE IF NOT EXISTS public.function_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  arguments jsonb NOT NULL,
  result jsonb,
  success boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Add foreign key only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'function_calls_user_id_fkey'
  ) THEN
    ALTER TABLE public.function_calls
    ADD CONSTRAINT function_calls_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- Create notes table (for function calling feature)
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add foreign keys only if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_user_id_fkey'
  ) THEN
    ALTER TABLE public.notes
    ADD CONSTRAINT notes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'notes_source_id_fkey'
  ) THEN
    ALTER TABLE public.notes
    ADD CONSTRAINT notes_source_id_fkey
    FOREIGN KEY (source_id) REFERENCES public.sources(id);
  END IF;
END $$;

-- Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_message_feedback_user_id ON public.message_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_proactive_insights_user_id ON public.proactive_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_function_calls_user_id ON public.function_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_reasoning_steps_session ON public.reasoning_steps(session_id);
