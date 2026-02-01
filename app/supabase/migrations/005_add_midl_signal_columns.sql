-- Add MIDL-specific signal columns to entries table
-- Part of signals redesign (2026-01-30)
-- Aligned with Stephen's post-meditation reflection framework

-- MIDL-specific signals - Samatha assessment
ALTER TABLE entries ADD COLUMN IF NOT EXISTS skill_analyzed TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS samatha_tendency TEXT; -- 'strong', 'moderate', 'weak', 'none'
ALTER TABLE entries ADD COLUMN IF NOT EXISTS marker_present BOOLEAN;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS marker_notes TEXT;

-- Hindrance assessment
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hindrance_present BOOLEAN;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hindrance_notes TEXT;
ALTER TABLE entries ADD COLUMN IF NOT EXISTS hindrance_conditions TEXT[]; -- what triggered the hindrance

-- Working with experience
ALTER TABLE entries ADD COLUMN IF NOT EXISTS balance_approach TEXT; -- how they worked with hindrance
ALTER TABLE entries ADD COLUMN IF NOT EXISTS key_understanding TEXT; -- insight gained

-- Techniques and progression
ALTER TABLE entries ADD COLUMN IF NOT EXISTS techniques_mentioned TEXT[];
ALTER TABLE entries ADD COLUMN IF NOT EXISTS progression_signals TEXT[];

-- Add index for querying entries by skill and samatha tendency
-- Useful for tracking development over time
CREATE INDEX IF NOT EXISTS idx_entries_skill_signals
ON entries(user_id, skill_analyzed, samatha_tendency, marker_present, hindrance_present);

-- Add index for finding entries with progression signals
CREATE INDEX IF NOT EXISTS idx_entries_progression
ON entries(user_id, skill_practiced)
WHERE array_length(progression_signals, 1) > 0;

-- Add index for finding hindrance patterns with conditions
CREATE INDEX IF NOT EXISTS idx_entries_hindrance_patterns
ON entries(user_id, skill_practiced, hindrance_present)
WHERE hindrance_present = true;
