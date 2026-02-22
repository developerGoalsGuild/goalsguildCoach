/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler. Uses raw body for signature verification.
 */

import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db.js';
import {
  verifyWebhookSignature,
  getSubscription,
} from '../../../lib/stripe.js';

const processedEventIds = new Set();

export async function POST(request) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  let body;
  try {
    body = await request.text();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  let event;
  try {
    event = verifyWebhookSignature(body, signature);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (processedEventIds.has(event.id)) {
    return NextResponse.json({ received: true });
  }
  processedEventIds.add(event.id);

  const pool = getPool();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const customerId =
          typeof session.customer === 'string'
            ? session.customer
            : session.customer?.id;
        const subscriptionId =
          typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription?.id;

        if (!userId || !subscriptionId) {
          console.error('checkout.session.completed: missing userId or subscription');
          break;
        }

        const stripeSub = await getSubscription(subscriptionId);
        const priceId = stripeSub.items?.data?.[0]?.price?.id;
        if (!priceId) break;

        const planResult = await pool.query(
          `SELECT id FROM subscription_plans WHERE stripe_price_id_monthly = $1 LIMIT 1`,
          [priceId]
        );
        if (planResult.rows.length === 0) {
          console.error('checkout.session.completed: no plan for price', priceId);
          break;
        }
        const planId = planResult.rows[0].id;

        const periodStart = new Date(stripeSub.current_period_start * 1000);
        const periodEnd = new Date(stripeSub.current_period_end * 1000);

        await pool.query(
          `INSERT INTO user_subscriptions (
            user_id, plan_id, stripe_customer_id, stripe_subscription_id,
            stripe_price_id, status, current_period_start, current_period_end
          ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7)`,
          [
            userId,
            planId,
            customerId || null,
            subscriptionId,
            priceId,
            periodStart,
            periodEnd,
          ]
        );
        break;
      }

      case 'customer.subscription.updated': {
        const stripeSub = event.data.object;
        const subscriptionId = stripeSub.id;
        const periodEnd = new Date(stripeSub.current_period_end * 1000);
        const cancelAtPeriodEnd = !!stripeSub.cancel_at_period_end;
        const priceId = stripeSub.items?.data?.[0]?.price?.id;

        if (priceId) {
          const planResult = await pool.query(
            `SELECT id FROM subscription_plans WHERE stripe_price_id_monthly = $1 LIMIT 1`,
            [priceId]
          );
          if (planResult.rows.length > 0) {
            const planId = planResult.rows[0].id;
            await pool.query(
              `UPDATE user_subscriptions
               SET plan_id = $1, current_period_end = $2, cancel_at_period_end = $3, updated_at = CURRENT_TIMESTAMP
               WHERE stripe_subscription_id = $4`,
              [planId, periodEnd, cancelAtPeriodEnd, subscriptionId]
            );
            break;
          }
        }
        await pool.query(
          `UPDATE user_subscriptions
           SET current_period_end = $1, cancel_at_period_end = $2, updated_at = CURRENT_TIMESTAMP
           WHERE stripe_subscription_id = $3`,
          [periodEnd, cancelAtPeriodEnd, subscriptionId]
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSub = event.data.object;
        const subscriptionId = stripeSub.id;

        await pool.query(
          `UPDATE user_subscriptions
           SET status = 'canceled', canceled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
           WHERE stripe_subscription_id = $1`,
          [subscriptionId]
        );
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        const amount = (invoice.amount_paid || 0) / 100;
        const currency = (invoice.currency || 'brl').toUpperCase();
        const paidAt = invoice.status_transitions?.paid_at
          ? new Date(invoice.status_transitions.paid_at * 1000)
          : new Date();

        if (!subscriptionId) break;

        const subResult = await pool.query(
          `SELECT id, user_id FROM user_subscriptions WHERE stripe_subscription_id = $1 LIMIT 1`,
          [subscriptionId]
        );
        if (subResult.rows.length === 0) break;
        const { id: subRowId, user_id: userId } = subResult.rows[0];

        const existing = await pool.query(
          `SELECT 1 FROM payments WHERE stripe_invoice_id = $1 LIMIT 1`,
          [invoice.id]
        );
        if (existing.rows.length === 0) {
          await pool.query(
            `INSERT INTO payments (user_id, subscription_id, stripe_invoice_id, amount, currency, status, paid_at)
             VALUES ($1, $2, $3, $4, $5, 'succeeded', $6)`,
            [userId, subRowId, invoice.id, amount, currency, paidAt]
          );
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId =
          typeof invoice.subscription === 'string'
            ? invoice.subscription
            : invoice.subscription?.id;
        if (!subscriptionId) break;

        const subResult = await pool.query(
          `SELECT id, user_id FROM user_subscriptions WHERE stripe_subscription_id = $1 LIMIT 1`,
          [subscriptionId]
        );
        if (subResult.rows.length === 0) break;
        const { id: subRowId, user_id: userId } = subResult.rows[0];
        const amount = (invoice.amount_due || 0) / 100;
        const currency = (invoice.currency || 'brl').toUpperCase();

        const existingFailed = await pool.query(
          `SELECT 1 FROM payments WHERE stripe_invoice_id = $1 LIMIT 1`,
          [invoice.id]
        );
        if (existingFailed.rows.length === 0) {
          await pool.query(
            `INSERT INTO payments (user_id, subscription_id, stripe_invoice_id, amount, currency, status)
             VALUES ($1, $2, $3, $4, $5, 'failed')`,
            [userId, subRowId, invoice.id, amount, currency]
          );
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error('Stripe webhook handler error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
