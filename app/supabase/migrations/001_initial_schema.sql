-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  onboarding_data JSONB,
  settings JSONB DEFAULT '{"notifications_enabled": false, "notification_time": "08:00"}'::jsonb,
  current_skill TEXT DEFAULT '00',
  stats JSONB DEFAULT '{"streak": 0, "total_sessions": 0, "current_skill_days": 0}'::jsonb
);

-- Entries table (unified Reflect + Ask)
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  type TEXT NOT NULL CHECK (type IN ('reflect', 'ask')),
  is_guided BOOLEAN DEFAULT false,
  track_progress BOOLEAN DEFAULT true,

  raw_content TEXT NOT NULL,
  duration_seconds INTEGER,
  skill_practiced TEXT,

  -- AI-extracted signals (populated async)
  summary TEXT,
  mood_score SMALLINT CHECK (mood_score BETWEEN 1 AND 5),
  mood_tags TEXT[],
  themes TEXT[],
  has_breakthrough BOOLEAN DEFAULT false,
  has_struggle BOOLEAN DEFAULT false,
  has_crisis_flag BOOLEAN DEFAULT false,

  embedding VECTOR(1536),
  processed_at TIMESTAMPTZ
);

-- Rolling summaries
CREATE TABLE context_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  entry_ids UUID[] NOT NULL,
  date_range_start TIMESTAMPTZ NOT NULL,
  date_range_end TIMESTAMPTZ NOT NULL,

  summary TEXT NOT NULL,
  key_themes TEXT[],
  mood_trend TEXT,
  notable_events TEXT[],

  parent_summary_id UUID REFERENCES context_summaries(id)
);

-- Indexes
CREATE INDEX idx_entries_user_created ON entries(user_id, created_at DESC);
CREATE INDEX idx_entries_user_themes ON entries USING GIN(themes);
CREATE INDEX idx_entries_embedding ON entries USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_context_summaries_user ON context_summaries(user_id, created_at DESC);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_summaries ENABLE ROW LEVEL SECURITY;

-- Policies: users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own entries" ON entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own summaries" ON context_summaries
  FOR ALL USING (auth.uid() = user_id);
