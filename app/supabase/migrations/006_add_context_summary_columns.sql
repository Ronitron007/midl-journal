-- Add new columns to context_summaries table
ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  summary_type TEXT CHECK (summary_type IN ('weekly', 'monthly'));

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  samatha_trend TEXT CHECK (samatha_trend IN ('strengthening', 'stable', 'struggling', 'variable'));

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  entry_count INTEGER DEFAULT 0;

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  hindrance_frequency JSONB DEFAULT '{}'::jsonb;

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  techniques_used TEXT[];

ALTER TABLE context_summaries ADD COLUMN IF NOT EXISTS
  avg_mood_score DECIMAL(3,2);

-- Pre-sit guidance on users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  pre_sit_guidance JSONB DEFAULT NULL;

-- Index for efficient lookups by type and date
CREATE INDEX IF NOT EXISTS idx_context_summaries_type
  ON context_summaries(user_id, summary_type, date_range_end DESC);

-- Note: We skip the week boundary index since date_trunc on timestamptz
-- is not immutable (timezone dependent). Weekly queries will use the
-- existing idx_entries_user_created index with range filters instead.
