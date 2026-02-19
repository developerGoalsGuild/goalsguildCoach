# 🔧 Example Integration: Adding Subscription Checks

This document shows how to integrate subscription checks into your existing API routes.

## Example 1: Quest Creation with Limit Check

### Before (No Limits)
```javascript
// app/api/quests/route.js
export async function POST(request) {
  const user = await getUserFromToken(request);
  const body = await request.json();
  
  // Create quest without checking limits
  const result = await pool.query(
    `INSERT INTO quests (user_id, title, ...) VALUES ($1, $2, ...)`,
    [user.id, body.title, ...]
  );
  
  return NextResponse.json({ quest: result.rows[0] });
}
```

### After (With Subscription Limits)
```javascript
// app/api/quests/route.js
import { getUserSubscription, getUserQuestCount, checkSubscriptionLimit } from '../../lib/subscription.js';

export async function POST(request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check quest limit
  const questCount = await getUserQuestCount(user.id);
  const limitCheck = await checkSubscriptionLimit(user.id, 'quests', questCount);
  
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { 
        error: limitCheck.message,
        limit: limitCheck.limit,
        current: questCount,
        remaining: limitCheck.remaining
      },
      { status: 403 }
    );
  }
  
  const body = await request.json();
  
  // Create quest
  const result = await pool.query(
    `INSERT INTO quests (user_id, title, ...) VALUES ($1, $2, ...) RETURNING *`,
    [user.id, body.title, ...]
  );
  
  return NextResponse.json({ quest: result.rows[0] });
}
```

## Example 2: Task Creation with Limit Check

```javascript
// app/api/tasks/route.js
import { getUserSubscription, getQuestTaskCount, checkSubscriptionLimit } from '../../lib/subscription.js';

export async function POST(request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  
  if (!body.quest_id) {
    return NextResponse.json({ error: 'quest_id required' }, { status: 400 });
  }
  
  // Check task limit for this quest
  const taskCount = await getQuestTaskCount(user.id, body.quest_id);
  const limitCheck = await checkSubscriptionLimit(user.id, 'tasks', taskCount);
  
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { 
        error: limitCheck.message,
        limit: limitCheck.limit,
        current: taskCount,
        remaining: limitCheck.remaining
      },
      { status: 403 }
    );
  }
  
  // Create task
  const result = await pool.query(
    `INSERT INTO tasks (user_id, quest_id, title, ...) VALUES ($1, $2, $3, ...) RETURNING *`,
    [user.id, body.quest_id, body.title, ...]
  );
  
  return NextResponse.json({ task: result.rows[0] });
}
```

## Example 3: Chat API with Daily Message Limit

```javascript
// app/api/chat/route.js
import { getUserSubscription, getDailyMessageCount, incrementDailyMessageUsage, checkSubscriptionLimit } from '../../lib/subscription.js';

export async function POST(request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check daily message limit
  const messageCount = await getDailyMessageCount(user.id);
  const limitCheck = await checkSubscriptionLimit(user.id, 'messages', messageCount);
  
  if (!limitCheck.allowed) {
    return NextResponse.json(
      { 
        error: limitCheck.message,
        limit: limitCheck.limit,
        current: messageCount,
        remaining: limitCheck.remaining,
        reset_at: new Date(new Date().setHours(24, 0, 0, 0)).toISOString() // Midnight
      },
      { status: 403 }
    );
  }
  
  // Increment usage BEFORE processing (to prevent race conditions)
  await incrementDailyMessageUsage(user.id);
  
  const body = await request.json();
  const message = body.message;
  
  // Process chat message...
  // ... your existing chat logic ...
  
  return NextResponse.json({ response: aiResponse });
}
```

## Example 4: Advanced Analytics Gate

```javascript
// app/api/analytics/route.js
import { hasFeatureAccess } from '../../lib/subscription.js';

export async function GET(request) {
  const user = await getUserFromToken(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Check if user has advanced analytics access
  const hasAccess = await hasFeatureAccess(user.id, 'advanced_analytics');
  
  if (!hasAccess) {
    return NextResponse.json(
      { 
        error: 'Advanced analytics is only available for Premium subscribers',
        upgrade_required: true
      },
      { status: 403 }
    );
  }
  
  // Return advanced analytics...
  const analytics = await getAdvancedAnalytics(user.id);
  
  return NextResponse.json({ analytics });
}
```

## Example 5: Frontend Usage Display

```javascript
// app/components/UsageMeter.js
'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '../lib/auth-helpers';

export default function UsageMeter() {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const res = await authFetch('/api/subscription/current');
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!usage) return null;

  const renderMeter = (label, current, limit, remaining) => {
    if (limit === null) {
      return (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>{label}</span>
            <span style={{ color: 'var(--green)' }}>Unlimited</span>
          </div>
        </div>
      );
    }

    const percentage = (current / limit) * 100;
    const isNearLimit = percentage >= 80;

    return (
      <div style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span>{label}</span>
          <span style={{ color: isNearLimit ? 'var(--red)' : 'var(--text-soft)' }}>
            {current} / {limit}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '8px',
            background: '#374151',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(percentage, 100)}%`,
              height: '100%',
              background: isNearLimit ? 'var(--red)' : 'var(--green)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        {isNearLimit && remaining === 0 && (
          <p style={{ fontSize: '0.8rem', color: 'var(--red)', marginTop: '0.5rem' }}>
            Limit reached! <a href="/subscription">Upgrade to Premium</a>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="glass-card" style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1rem' }}>Usage</h3>
      {renderMeter('Quests', usage.quests.current, usage.quests.limit, usage.quests.remaining)}
      {renderMeter('Tasks', usage.tasks.current, usage.tasks.limit, usage.tasks.remaining)}
      {renderMeter('Messages (today)', usage.messages.current, usage.messages.limit, usage.messages.remaining)}
    </div>
  );
}
```

## Example 6: Upgrade Prompt Component

```javascript
// app/components/UpgradePrompt.js
'use client';

import Link from 'next/link';

export default function UpgradePrompt({ feature, limit, current }) {
  if (limit === null) return null; // Unlimited, no prompt needed

  const percentage = (current / limit) * 100;
  const showPrompt = percentage >= 80;

  if (!showPrompt) return null;

  return (
    <div
      className="glass-card"
      style={{
        padding: '1rem',
        border: '1px solid var(--green)',
        background: 'rgba(34, 197, 94, 0.1)',
        marginBottom: '1rem',
      }}
    >
      <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
        ⚠️ {feature} limit almost reached
      </p>
      <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-soft)' }}>
        You've used {current} of {limit} {feature}. Upgrade to Premium for unlimited access.
      </p>
      <Link href="/subscription" className="btn btn-primary">
        Upgrade to Premium
      </Link>
    </div>
  );
}
```

---

## Quick Reference

### Subscription Helper Functions

```javascript
// Get user's subscription
const subscription = await getUserSubscription(userId);

// Check if user can perform action
const limitCheck = await checkSubscriptionLimit(userId, 'quests', currentCount);
if (!limitCheck.allowed) {
  // Handle limit reached
}

// Check feature access
const hasAccess = await hasFeatureAccess(userId, 'advanced_analytics');

// Get usage stats
const usageStats = await getUserUsageStats(userId);

// Track message usage
await incrementDailyMessageUsage(userId);
```

### Common Patterns

1. **Check limit before action**: Always check limits before creating resources
2. **Increment usage immediately**: For messages, increment before processing to prevent race conditions
3. **Return helpful errors**: Include limit info in error responses
4. **Show usage in UI**: Display usage meters and upgrade prompts
5. **Handle unlimited**: NULL limits mean unlimited, handle gracefully

---

**Last Updated:** February 19, 2026
