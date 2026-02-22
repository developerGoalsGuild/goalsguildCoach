/**
 * POST /api/subscription/cancel
 * Cancel subscription at period end (or immediately if requested)
 */

import { NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth.js';
import { getPool } from '../../../lib/db.js';
import { cancelSubscription } from '../../../lib/stripe.js';

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const immediately = !!body?.immediately;

    const pool = getPool();
    const subResult = await pool.query(
      `SELECT id, stripe_subscription_id FROM user_subscriptions
       WHERE user_id = $1 AND status = 'active' AND current_period_end > CURRENT_TIMESTAMP
       ORDER BY created_at DESC LIMIT 1`,
      [user.userId]
    );

    if (subResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const row = subResult.rows[0];
    const stripeSubscriptionId = row.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription has no Stripe ID' },
        { status: 400 }
      );
    }

    await cancelSubscription(stripeSubscriptionId, immediately);

    if (immediately) {
      await pool.query(
        `UPDATE user_subscriptions SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [row.id]
      );
    } else {
      await pool.query(
        `UPDATE user_subscriptions SET cancel_at_period_end = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [row.id]
      );
    }

    return NextResponse.json({
      success: true,
      cancel_at_period_end: !immediately,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
