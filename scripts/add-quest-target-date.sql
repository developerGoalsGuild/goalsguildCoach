-- Add target_date to quests so every quest must have a target date.
-- Run this if your quests table does not have target_date yet.

ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_date DATE;

COMMENT ON COLUMN quests.target_date IS 'Required: when the user aims to complete this quest (YYYY-MM-DD).';
