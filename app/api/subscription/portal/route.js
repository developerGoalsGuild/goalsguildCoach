/**
 * POST /api/subscription/portal
 * Create a Stripe Customer Billing Portal session (manage subscription, change plan, payment method)
 */

import { NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth.js';
import { getPool } from '../../../lib/db.js';
import { createBillingPortalSession } from '../../../lib/stripe.js';

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

    const pool = getPool();
    const result = await pool.query(
      `SELECT stripe_customer_id FROM user_subscriptions
       WHERE user_id = $1 AND stripe_customer_id IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [user.userId]
    );
    if (result.rows.length === 0 || !result.rows[0].stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account to manage. Upgrade to a paid plan first.' },
        { status: 400 }
      );
    }

    const baseUrl = getAllowlistedAppUrl();
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'App URL not configured.' },
        { status: 500 }
      );
    }
    const returnUrl = `${baseUrl.replace(/\/$/, '')}/profile`;

    const session = await createBillingPortalSession(
      result.rows[0].stripe_customer_id,
      returnUrl
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to open billing portal' },
      { status: 500 }
    );
  }
}
