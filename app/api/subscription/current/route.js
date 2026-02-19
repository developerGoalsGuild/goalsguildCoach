/**
 * GET /api/subscription/current
 * Get current user's subscription status
 */

import { NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth.js';
import { getUserSubscription, getUserUsageStats } from '../../../lib/subscription.js';

export async function GET(request) {
  try {
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = await getUserSubscription(user.id);
    const usageStats = await getUserUsageStats(user.id);

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        plan_name: subscription.plan_name,
        display_name: subscription.display_name,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      },
      usage: usageStats,
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    );
  }
}
