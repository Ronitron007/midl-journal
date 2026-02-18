-- Migration: Add multi-skill phase tracking to entries
-- Each sit is now a sequential journey through skills 00→frontier

ALTER TABLE entries ADD COLUMN frontier_skill TEXT;
ALTER TABLE entries ADD COLUMN skill_phases JSONB;

-- Backfill frontier_skill from existing skill_practiced
UPDATE entries SET frontier_skill = skill_practiced WHERE frontier_skill IS NULL;

-- Index for querying entries by user + frontier skill
CREATE INDEX idx_entries_frontier_skill ON entries(user_id, frontier_skill);
