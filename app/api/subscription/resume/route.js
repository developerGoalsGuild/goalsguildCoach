/**
 * POST /api/subscription/resume
 * Resume a subscription that was set to cancel at period end
 */

import { NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth.js';
import { getPool } from '../../../lib/db.js';
import { resumeSubscription } from '../../../lib/stripe.js';

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const subResult = await pool.query(
      `SELECT id, stripe_subscription_id, cancel_at_period_end FROM user_subscriptions
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
    if (!row.cancel_at_period_end) {
      return NextResponse.json(
        { success: true, message: 'Subscription is not set to cancel' }
      );
    }

    const stripeSubscriptionId = row.stripe_subscription_id;
    if (!stripeSubscriptionId) {
      return NextResponse.json(
        { error: 'Subscription has no Stripe ID' },
        { status: 400 }
      );
    }

    await resumeSubscription(stripeSubscriptionId);
    await pool.query(
      `UPDATE user_subscriptions SET cancel_at_period_end = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [row.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resume subscription error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
