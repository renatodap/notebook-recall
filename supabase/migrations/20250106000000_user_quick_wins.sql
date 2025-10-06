-- User Quick Wins Tracking Table
-- Tracks user progress through onboarding milestones

CREATE TABLE IF NOT EXISTS user_quick_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  win_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per user per win
  UNIQUE(user_id, win_id)
);

-- Row Level Security
ALTER TABLE user_quick_wins ENABLE ROW LEVEL SECURITY;

-- Users can only view/modify their own quick wins
CREATE POLICY "Users can view own quick wins"
ON user_quick_wins FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quick wins"
ON user_quick_wins FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quick wins"
ON user_quick_wins FOR UPDATE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_user_quick_wins_user_id ON user_quick_wins(user_id);
CREATE INDEX idx_user_quick_wins_completed ON user_quick_wins(completed);
CREATE INDEX idx_user_quick_wins_win_id ON user_quick_wins(win_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_user_quick_wins_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_quick_wins_updated_at
BEFORE UPDATE ON user_quick_wins
FOR EACH ROW
EXECUTE FUNCTION update_user_quick_wins_updated_at();

-- Comments
COMMENT ON TABLE user_quick_wins IS 'Tracks user progress through onboarding milestones and quick wins';
COMMENT ON COLUMN user_quick_wins.win_id IS 'Identifier for the win (e.g., first_source, first_search, onboarding_started)';
COMMENT ON COLUMN user_quick_wins.completed IS 'Whether this milestone has been achieved';
COMMENT ON COLUMN user_quick_wins.completed_at IS 'Timestamp when milestone was completed';
