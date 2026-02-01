-- Add entry_date column for user-selectable entry date
-- Defaults to current date, allows backdating entries
ALTER TABLE entries ADD COLUMN entry_date DATE DEFAULT CURRENT_DATE;

-- Backfill existing entries with their created_at date
UPDATE entries SET entry_date = created_at::DATE WHERE entry_date IS NULL;

-- Make it non-nullable after backfill
ALTER TABLE entries ALTER COLUMN entry_date SET NOT NULL;
