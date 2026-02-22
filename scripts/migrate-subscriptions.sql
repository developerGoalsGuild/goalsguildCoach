-- Subscription System Migration
-- Run this script to set up the subscription tables

BEGIN;

-- 1. Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10, 2),
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  
  -- Feature limits
  max_quests INTEGER,
  max_tasks_per_quest INTEGER,
  max_daily_messages INTEGER,
  max_personas INTEGER DEFAULT 1,
  
  -- Feature flags
  advanced_analytics BOOLEAN DEFAULT false,
  data_export BOOLEAN DEFAULT false,
  priority_support BOOLEAN DEFAULT false,
  team_collaboration BOOLEAN DEFAULT false,
  api_access BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Stripe integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  
  -- Subscription status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  
  -- Billing cycle
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  
  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe data
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL,
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create daily_message_usage table
CREATE TABLE IF NOT EXISTS daily_message_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- 5. Add subscription fields to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'default_plan_id'
  ) THEN
    ALTER TABLE users ADD COLUMN default_plan_id UUID REFERENCES subscription_plans(id);
  END IF;
END $$;

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_name ON subscription_plans(name);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_daily_message_usage_user_date ON daily_message_usage(user_id, date);

-- 7. Insert default subscription plans (Free, Starter, Premium — USD)
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, currency, max_quests, max_tasks_per_quest, max_daily_messages, max_personas, advanced_analytics, data_export, priority_support)
VALUES
  ('free', 'Free', 0.00, NULL, 'USD', 1, 10, 20, 1, false, false, false),
  ('starter', 'Starter', 4.99, 49.99, 'USD', 3, 25, 50, 2, false, false, false),
  ('premium', 'Premium', 9.99, 99.99, 'USD', NULL, NULL, NULL, NULL, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- 8. Set default plan for existing users
UPDATE users 
SET default_plan_id = (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1)
WHERE default_plan_id IS NULL;

-- 9. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then create them
DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_message_usage_updated_at ON daily_message_usage;
CREATE TRIGGER update_daily_message_usage_updated_at BEFORE UPDATE ON daily_message_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 10. Create function to get user's active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_id UUID,
  plan_name VARCHAR,
  plan_display_name VARCHAR,
  status VARCHAR,
  current_period_end TIMESTAMP,
  max_quests INTEGER,
  max_tasks_per_quest INTEGER,
  max_daily_messages INTEGER,
  max_personas INTEGER,
  advanced_analytics BOOLEAN,
  data_export BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.id,
    us.plan_id,
    sp.name,
    sp.display_name,
    us.status,
    us.current_period_end,
    sp.max_quests,
    sp.max_tasks_per_quest,
    sp.max_daily_messages,
    sp.max_personas,
    sp.advanced_analytics,
    sp.data_export
  FROM user_subscriptions us
  JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = p_user_id
    AND us.status = 'active'
    AND us.current_period_end > CURRENT_TIMESTAMP
  ORDER BY us.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verify migration
SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS plans_created FROM subscription_plans;
