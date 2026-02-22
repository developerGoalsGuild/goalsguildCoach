/**
 * POST /api/subscription/checkout
 * Create a Stripe Checkout session for subscription
 */

import { NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth.js';
import { getPool } from '../../../lib/db.js';
import { createCheckoutSession } from '../../../lib/stripe.js';

function getAllowlistedAppUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url && !/placeholder|changeme/i.test(url)) return url;
  const list = process.env.ALLOWED_APP_URLS;
  if (list) {
    const first = list.split(',')[0]?.trim();
    if (first) return first;
  }
  if (process.env.NODE_ENV !== 'production') return 'http://localhost:3002';
  return null;
}

export async function POST(request) {
  try {
    const user = getUserFromToken(request);
    if (!user || !user.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const planId = body?.planId;
    if (!planId) {
      return NextResponse.json(
        { error: 'planId is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    const planResult = await pool.query(
      `SELECT id, name, stripe_price_id_monthly FROM subscription_plans WHERE id = $1`,
      [planId]
    );
    if (planResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 400 }
      );
    }
    const plan = planResult.rows[0];
    if (!plan.stripe_price_id_monthly) {
      return NextResponse.json(
        { error: 'Plan has no Stripe price configured' },
        { status: 400 }
      );
    }

    let customerId = null;
    try {
      const subResult = await pool.query(
        `SELECT stripe_customer_id FROM user_subscriptions
         WHERE user_id = $1 AND stripe_customer_id IS NOT NULL
         ORDER BY created_at DESC LIMIT 1`,
        [user.userId]
      );
      if (subResult.rows.length > 0) {
        customerId = subResult.rows[0].stripe_customer_id;
      }
    } catch (_) {
      // Table may not exist yet; continue without customerId
    }

    const baseUrl = getAllowlistedAppUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'App URL not configured. Set NEXT_PUBLIC_APP_URL or ALLOWED_APP_URLS.' },
        { status: 500 }
      );
    }
    const successUrl = `${baseUrl.replace(/\/$/, '')}/subscription/success`;
    const cancelUrl = `${baseUrl.replace(/\/$/, '')}/subscription/cancel`;

    const session = await createCheckoutSession({
      customerId: customerId || undefined,
      priceId: plan.stripe_price_id_monthly,
      userId: user.userId,
      successUrl,
      cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
