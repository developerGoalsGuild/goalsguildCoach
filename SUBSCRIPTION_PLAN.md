# 📋 Subscription Plans & Implementation Guide

## 🎯 Overview

This document outlines the subscription plans, database schema, and implementation strategy for GoalsGuild Coach's monetization system.

---

## 💎 Subscription Tiers

All prices in **USD**.

### Free Plan
**Price:** $0/month

**Limits:**
- ✅ 2 objectives created by AI (total or per month)
- ✅ 2 quests created by AI (per month)
- ✅ 10 quests created manually
- ✅ Unlimited tasks
- ✅ Basic analytics, 1 persona

**Features:**
- Quest and task management
- Coach AI chat (limited)
- Basic progress tracking
- Achievement system

---

### Starter Plan
**Price:** $4.99/month or $49.99/year

**Limits:**
- ✅ 5 objectives created by AI per month
- ✅ 10 quests created by AI per month
- ✅ Unlimited quests and tasks created manually
- ✅ Basic analytics, 2 personas

**Features:**
- Everything in Free with higher AI limits
- More AI-generated objectives and quests

---

### Premium Plan
**Price:** $9.99/month or $99.99/year

**Limits:**
- ✅ 15 objectives created by AI per month
- ✅ 30 quests created by AI per month
- ✅ Unlimited quests and tasks created manually
- ✅ Advanced analytics & insights
- ✅ All persona customizations
- ✅ Export data (JSON/CSV)
- ✅ Priority support

**Features:**
- Everything in Starter +
- Highest AI generation limits
- Data export
- Priority support

---

## 🗄️ Database Schema

### 1. Subscription Plans Table

```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- 'free', 'starter', 'premium'
  display_name VARCHAR(100) NOT NULL, -- 'Free', 'Starter', 'Premium'
  price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  price_yearly DECIMAL(10, 2), -- Optional: annual pricing
  currency VARCHAR(3) NOT NULL DEFAULT 'USD', -- 'USD'
  stripe_price_id_monthly VARCHAR(255), -- Stripe Price ID
  stripe_price_id_yearly VARCHAR(255),
  
  -- Feature limits
  max_quests INTEGER, -- NULL = unlimited
  max_tasks_per_quest INTEGER, -- NULL = unlimited
  max_daily_messages INTEGER, -- NULL = unlimited
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

-- Insert default plans
INSERT INTO subscription_plans (name, display_name, price_monthly, price_yearly, currency, max_quests, max_tasks_per_quest, max_daily_messages, max_personas, advanced_analytics, data_export, priority_support) VALUES
('free', 'Free', 0.00, NULL, 'USD', 1, 10, 20, 1, false, false, false),
('starter', 'Starter', 4.99, 49.99, 'USD', 3, 25, 50, 2, false, false, false),
('premium', 'Premium', 9.99, 99.99, 'USD', NULL, NULL, NULL, NULL, true, true, true);

-- Create index
CREATE INDEX idx_subscription_plans_name ON subscription_plans(name);
```

### 2. User Subscriptions Table

```sql
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  
  -- Stripe integration
  stripe_customer_id VARCHAR(255) UNIQUE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  
  -- Subscription status
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'trialing', 'incomplete'
  
  -- Billing cycle
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,
  
  -- Trial
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_active_subscription UNIQUE(user_id, status) WHERE status = 'active'
);

-- Indexes
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
```

### 3. Payment History Table

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  
  -- Stripe data
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  
  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed', 'refunded'
  
  -- Metadata
  description TEXT,
  metadata JSONB, -- Store additional Stripe metadata
  
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
```

### 4. Usage Tracking Table (Extend Existing)

```sql
-- Extend existing usage_tracking table with subscription context
ALTER TABLE usage_tracking 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50);

-- Add daily message tracking for free tier limits
CREATE TABLE IF NOT EXISTS daily_message_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_message_usage_user_date ON daily_message_usage(user_id, date);
```

### 5. Update Users Table

```sql
-- Add subscription-related fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS default_plan_id UUID REFERENCES subscription_plans(id) DEFAULT (SELECT id FROM subscription_plans WHERE name = 'free' LIMIT 1);
```

---

## 🔧 Implementation Plan

### Phase 1: Database Setup ✅
- [x] Create subscription plans table
- [x] Create user subscriptions table
- [x] Create payments table
- [x] Create daily message usage tracking
- [x] Update users table
- [x] Create migration script

### Phase 2: Stripe Integration
- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Set up Stripe account and get API keys
- [ ] Create Stripe products and prices in Stripe Dashboard
- [ ] Add Stripe keys to `.env.local`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Create Stripe service wrapper (`app/lib/stripe.js`)

### Phase 3: Backend API Routes

#### 3.1 Subscription Management
- [ ] `GET /api/subscription/plans` - List all available plans
- [ ] `GET /api/subscription/current` - Get user's current subscription
- [ ] `POST /api/subscription/create-checkout` - Create Stripe checkout session
- [ ] `POST /api/subscription/cancel` - Cancel subscription
- [ ] `POST /api/subscription/resume` - Resume canceled subscription
- [ ] `GET /api/subscription/usage` - Get current usage stats

#### 3.2 Stripe Webhooks
- [ ] `POST /api/webhooks/stripe` - Handle Stripe events:
  - `checkout.session.completed` - Subscription created
  - `customer.subscription.updated` - Subscription updated
  - `customer.subscription.deleted` - Subscription canceled
  - `invoice.payment_succeeded` - Payment successful
  - `invoice.payment_failed` - Payment failed

#### 3.3 Middleware & Helpers
- [ ] `app/lib/subscription.js` - Subscription helper functions:
  - `getUserSubscription(userId)` - Get active subscription
  - `checkSubscriptionLimit(userId, feature, currentUsage)` - Check if user can use feature
  - `incrementUsage(userId, feature)` - Track usage
  - `requireSubscription(userId, minPlan)` - Middleware helper

### Phase 4: Feature Gating

#### 4.1 Quest Limits
- [ ] Update `POST /api/quests` to check quest limit
- [ ] Update `GET /api/quests` to filter based on plan
- [ ] Add limit checks in quest creation UI

#### 4.2 Task Limits
- [ ] Update `POST /api/tasks` to check task limit per quest
- [ ] Add limit checks in task creation UI

#### 4.3 Message Limits
- [ ] Update `POST /api/chat` to check daily message limit
- [ ] Track message usage in `daily_message_usage` table
- [ ] Reset daily counter at midnight (cron job or scheduled function)
- [ ] Show message countdown in UI

#### 4.4 Advanced Features
- [ ] Gate advanced analytics behind premium
- [ ] Gate data export behind premium
- [ ] Gate multiple personas behind premium

### Phase 5: Frontend Components

#### 5.1 Subscription Status Component
- [ ] `app/components/SubscriptionBadge.js` - Show current plan badge
- [ ] `app/components/UsageMeter.js` - Show usage progress bars
- [ ] `app/components/UpgradePrompt.js` - Show upgrade prompts when limits reached

#### 5.2 Subscription Management Page
- [ ] `app/subscription/page.js` - Subscription management page:
  - Current plan display
  - Usage statistics
  - Upgrade/downgrade buttons
  - Payment history
  - Cancel subscription option

#### 5.3 Checkout Flow
- [ ] `app/subscription/checkout/page.js` - Stripe checkout page
- [ ] `app/subscription/success/page.js` - Success page after payment
- [ ] `app/subscription/cancel/page.js` - Cancel page

#### 5.4 UI Updates
- [ ] Add subscription badge to TopNavigation
- [ ] Add usage warnings when approaching limits
- [ ] Add upgrade prompts in relevant pages
- [ ] Update empty states to show upgrade options

### Phase 6: Testing & Validation
- [ ] Test free tier limits
- [ ] Test premium tier unlimited access
- [ ] Test Stripe checkout flow
- [ ] Test webhook handling
- [ ] Test subscription cancellation
- [ ] Test payment failures
- [ ] Test usage tracking accuracy

---

## 📝 Code Structure

### File Organization

```
app/
├── api/
│   ├── subscription/
│   │   ├── plans/route.js
│   │   ├── current/route.js
│   │   ├── checkout/route.js
│   │   ├── cancel/route.js
│   │   └── usage/route.js
│   └── webhooks/
│       └── stripe/route.js
├── lib/
│   ├── stripe.js          # Stripe client wrapper
│   ├── subscription.js    # Subscription helpers
│   └── usage-tracking.js  # Usage tracking helpers
├── components/
│   ├── SubscriptionBadge.js
│   ├── UsageMeter.js
│   └── UpgradePrompt.js
└── subscription/
    ├── page.js            # Subscription management
    ├── checkout/page.js   # Checkout flow
    ├── success/page.js    # Success page
    └── cancel/page.js     # Cancel page
```

---

## 🔐 Security Considerations

1. **Webhook Verification**: Always verify Stripe webhook signatures
2. **Rate Limiting**: Add rate limiting to subscription endpoints
3. **User Isolation**: Ensure users can only access their own subscription data
4. **Input Validation**: Validate all subscription-related inputs
5. **SQL Injection**: Use parameterized queries (already in place)
6. **Environment Variables**: Never commit Stripe keys to git

---

## 🧪 Testing Strategy

### Unit Tests
- Subscription helper functions
- Usage tracking logic
- Feature gating logic

### Integration Tests
- Stripe checkout flow
- Webhook handling
- Subscription lifecycle (create → update → cancel)

### E2E Tests
- Complete subscription flow from UI
- Usage limit enforcement
- Upgrade/downgrade flows

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
- Active subscriptions count
- Monthly Recurring Revenue (MRR)
- Churn rate
- Conversion rate (free → premium)
- Average Revenue Per User (ARPU)
- Usage patterns by tier

### Logging
- Log all subscription events
- Log payment failures
- Log limit violations
- Log webhook events

---

## 🚀 Deployment Checklist

- [ ] Set up Stripe account (production)
- [ ] Create Stripe products and prices
- [ ] Add production Stripe keys to environment
- [ ] Set up Stripe webhook endpoint
- [ ] Test webhook endpoint with Stripe CLI
- [ ] Run database migrations
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Monitor for errors
- [ ] Set up alerts for payment failures

---

## 📚 Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

---

## 🎯 Next Steps

1. **Start with Phase 1**: Set up database schema
2. **Phase 2**: Integrate Stripe
3. **Phase 3**: Build API routes
4. **Phase 4**: Implement feature gating
5. **Phase 5**: Build UI components
6. **Phase 6**: Test thoroughly
7. **Deploy**: Go live!

---

**Last Updated:** February 19, 2026
**Status:** Planning Phase
