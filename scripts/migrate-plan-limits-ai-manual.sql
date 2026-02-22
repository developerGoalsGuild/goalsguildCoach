-- Migration: Plan limits by AI vs manual (objectives, quests)
-- Free: 2 objectives AI, 2 quests AI, 10 quests manual, unlimited tasks
-- Starter: 5 objectives AI/month, 10 quests AI/month, unlimited manual
-- Premium: 15 objectives AI/month, 30 quests AI/month, unlimited manual

BEGIN;

-- 1. Add created_by_ai to goals (objectives) and quests
ALTER TABLE goals ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT false;
ALTER TABLE quests ADD COLUMN IF NOT EXISTS created_by_ai BOOLEAN DEFAULT false;

-- 2. Add new limit columns to subscription_plans
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_objectives_ai_per_month INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_quests_ai_per_month INTEGER;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS max_quests_manual INTEGER;

-- 3. Set limits for each plan (objectives/quests = goals/quests in app)
-- Free: 2 objectives AI, 2 quests AI, 10 quests manual, unlimited tasks
UPDATE subscription_plans SET
  max_objectives_ai_per_month = 2,
  max_quests_ai_per_month = 2,
  max_quests_manual = 10,
  max_quests = NULL,
  max_tasks_per_quest = NULL,
  max_daily_messages = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'free';

-- Starter: 5 objectives AI/month, 10 quests AI/month, unlimited manual
UPDATE subscription_plans SET
  max_objectives_ai_per_month = 5,
  max_quests_ai_per_month = 10,
  max_quests_manual = NULL,
  max_quests = NULL,
  max_tasks_per_quest = NULL,
  max_daily_messages = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'starter';

-- Premium: 15 objectives AI/month, 30 quests AI/month, unlimited manual
UPDATE subscription_plans SET
  max_objectives_ai_per_month = 15,
  max_quests_ai_per_month = 30,
  max_quests_manual = NULL,
  max_quests = NULL,
  max_tasks_per_quest = NULL,
  max_daily_messages = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE name = 'premium';

COMMIT;

SELECT 'Plan limits (AI vs manual) applied' AS status;
SELECT name, max_objectives_ai_per_month, max_quests_ai_per_month, max_quests_manual FROM subscription_plans ORDER BY price_monthly;
