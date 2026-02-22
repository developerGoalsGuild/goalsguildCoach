-- Add user profile fields for coach personalization (optional at registration)
-- Run with: psql $DATABASE_URL -f scripts/migrate-user-profile-fields.sql

ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_work_hours DECIMAL(3,1);
ALTER TABLE users ADD COLUMN IF NOT EXISTS focus_area VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS context_for_coach TEXT;
