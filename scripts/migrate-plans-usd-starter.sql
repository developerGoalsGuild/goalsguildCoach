-- Migration: Free, Starter, Premium plans with USD prices
-- Run this if you already ran migrate-subscriptions.sql with the old BRL/2-plan seed.
-- New installs: migrate-subscriptions.sql already inserts these three plans in USD.

BEGIN;

-- Update existing Free plan to USD
UPDATE subscription_plans
SET currency = 'USD', price_monthly = 0.00, price_yearly = NULL, updated_at = CURRENT_TIMESTAMP
WHERE name = 'free';

-- Update existing Premium plan to USD and enable priority_support
UPDATE subscription_plans
SET currency = 'USD', price_monthly = 9.99, price_yearly = 99.99, priority_support = true, updated_at = CURRENT_TIMESTAMP
WHERE name = 'premium';

-- Insert Starter plan (or update if already exists)
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, currency, max_quests, max_tasks_per_quest, max_daily_messages, max_personas, advanced_analytics, data_export, priority_support)
VALUES ('starter', 'Starter', 4.99, 49.99, 'USD', 3, 25, 50, 2, false, false, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  currency = EXCLUDED.currency,
  max_quests = EXCLUDED.max_quests,
  max_tasks_per_quest = EXCLUDED.max_tasks_per_quest,
  max_daily_messages = EXCLUDED.max_daily_messages,
  max_personas = EXCLUDED.max_personas,
  advanced_analytics = EXCLUDED.advanced_analytics,
  data_export = EXCLUDED.data_export,
  priority_support = EXCLUDED.priority_support,
  updated_at = CURRENT_TIMESTAMP;

COMMIT;

SELECT 'Plans updated: Free, Starter, Premium (USD)' AS status;
SELECT name, display_name, price_monthly, price_yearly, currency FROM subscription_plans ORDER BY price_monthly;
