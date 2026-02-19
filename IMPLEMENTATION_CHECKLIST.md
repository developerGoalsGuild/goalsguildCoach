# ✅ Subscription Implementation Checklist

Use this checklist to track your progress implementing the subscription system.

## Phase 1: Database Setup

- [ ] Run migration script: `scripts/migrate-subscriptions.sql`
- [ ] Verify tables created successfully
- [ ] Verify default plans inserted
- [ ] Test database queries manually

## Phase 2: Stripe Setup

- [ ] Create Stripe account (if not exists)
- [ ] Get Stripe API keys (test mode)
- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Create Stripe products:
  - [ ] Free Plan (price: $0)
  - [ ] Premium Plan (price: R$ 29.90/month)
- [ ] Get Stripe Price IDs
- [ ] Update `subscription_plans` table with Stripe Price IDs
- [ ] Add Stripe keys to `.env.local`:
  ```
  STRIPE_SECRET_KEY=sk_test_...
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_WEBHOOK_SECRET=whsec_...
  ```
- [ ] Create `app/lib/stripe.js` wrapper

## Phase 3: Backend API Routes

### Subscription Management
- [ ] `GET /api/subscription/plans` - List plans
- [ ] `GET /api/subscription/current` - Get current subscription
- [ ] `POST /api/subscription/create-checkout` - Create checkout session
- [ ] `POST /api/subscription/cancel` - Cancel subscription
- [ ] `POST /api/subscription/resume` - Resume subscription
- [ ] `GET /api/subscription/usage` - Get usage stats

### Stripe Webhooks
- [ ] `POST /api/webhooks/stripe` - Webhook handler
- [ ] Handle `checkout.session.completed`
- [ ] Handle `customer.subscription.updated`
- [ ] Handle `customer.subscription.deleted`
- [ ] Handle `invoice.payment_succeeded`
- [ ] Handle `invoice.payment_failed`
- [ ] Test webhooks with Stripe CLI

## Phase 4: Feature Gating

### Quest Limits
- [ ] Update `POST /api/quests` to check limit
- [ ] Return error when limit reached
- [ ] Add limit check in quest creation UI

### Task Limits
- [ ] Update `POST /api/tasks` to check limit
- [ ] Return error when limit reached
- [ ] Add limit check in task creation UI

### Message Limits
- [ ] Update `POST /api/chat` to check daily limit
- [ ] Track message usage
- [ ] Return error when limit reached
- [ ] Show message countdown in chat UI

### Advanced Features
- [ ] Gate advanced analytics
- [ ] Gate data export
- [ ] Gate multiple personas

## Phase 5: Frontend Components

### Subscription Status
- [ ] `SubscriptionBadge` component
- [ ] `UsageMeter` component
- [ ] `UpgradePrompt` component

### Subscription Pages
- [ ] `/subscription` - Management page
- [ ] `/subscription/checkout` - Checkout page
- [ ] `/subscription/success` - Success page
- [ ] `/subscription/cancel` - Cancel page

### UI Updates
- [ ] Add subscription badge to navigation
- [ ] Add usage warnings
- [ ] Add upgrade prompts
- [ ] Update empty states

## Phase 6: Testing

### Unit Tests
- [ ] Test subscription helpers
- [ ] Test usage tracking
- [ ] Test feature gating

### Integration Tests
- [ ] Test Stripe checkout flow
- [ ] Test webhook handling
- [ ] Test subscription lifecycle

### Manual Testing
- [ ] Test free tier limits
- [ ] Test premium tier unlimited
- [ ] Test checkout flow
- [ ] Test cancellation
- [ ] Test payment failures
- [ ] Test usage tracking

## Phase 7: Deployment

- [ ] Set up production Stripe account
- [ ] Create production products/prices
- [ ] Add production keys to environment
- [ ] Set up webhook endpoint
- [ ] Test webhook endpoint
- [ ] Run database migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Monitor for errors
- [ ] Set up alerts

## Notes

- Start with test mode Stripe keys
- Test thoroughly before going to production
- Monitor usage and subscription metrics
- Set up error alerts for payment failures

---

**Last Updated:** February 19, 2026
