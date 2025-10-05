-- Feature 3: User Profiles for Cross-Session Intelligence
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  research_interests TEXT[] DEFAULT '{}',
  writing_style TEXT DEFAULT 'detailed' CHECK (writing_style IN ('concise', 'detailed', 'academic')),
  preferred_citation_style TEXT DEFAULT 'APA',
  expertise_domains TEXT[] DEFAULT '{}',
  interaction_count INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);

-- Feature 8: Message Feedback for Adaptive Learning
CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  was_helpful BOOLEAN DEFAULT false,
  feedback_text TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_feedback_user_id_idx ON message_feedback(user_id);
CREATE INDEX IF NOT EXISTS message_feedback_timestamp_idx ON message_feedback(timestamp);

-- Feature 5: Proactive Insights Storage
CREATE TABLE IF NOT EXISTS proactive_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  insight_type TEXT CHECK (insight_type IN ('connection', 'gap', 'contradiction', 'recommendation')),
  message TEXT NOT NULL,
  source_ids UUID[],
  confidence FLOAT,
  was_shown BOOLEAN DEFAULT false,
  was_accepted BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS proactive_insights_user_id_idx ON proactive_insights(user_id);
CREATE INDEX IF NOT EXISTS proactive_insights_session_id_idx ON proactive_insights(session_id);

-- Feature 7: Reasoning Steps Storage
CREATE TABLE IF NOT EXISTS reasoning_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT NOT NULL,
  session_id UUID,
  step_number INTEGER NOT NULL,
  thought TEXT NOT NULL,
  conclusion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reasoning_steps_message_id_idx ON reasoning_steps(message_id);
CREATE INDEX IF NOT EXISTS reasoning_steps_session_id_idx ON reasoning_steps(session_id);

-- Feature 6: Function Call Log
CREATE TABLE IF NOT EXISTS function_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID,
  function_name TEXT NOT NULL,
  arguments JSONB,
  result JSONB,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS function_calls_user_id_idx ON function_calls(user_id);
CREATE INDEX IF NOT EXISTS function_calls_session_id_idx ON function_calls(session_id);
CREATE INDEX IF NOT EXISTS function_calls_function_name_idx ON function_calls(function_name);

-- Notes table for create_note function
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON notes USING GIN(tags);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
