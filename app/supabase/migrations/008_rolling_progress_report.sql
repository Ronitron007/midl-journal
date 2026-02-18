-- Migration: Add rolling progress report to users
-- Structured JSON generated from recent entries, used for coherence filtering

ALTER TABLE users ADD COLUMN progress_report JSONB DEFAULT NULL;
