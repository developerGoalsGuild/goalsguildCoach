/**
 * Stripe Integration Wrapper
 * Handles Stripe API interactions
 */

import Stripe from 'stripe';

let stripe = null;

function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.warn('STRIPE_SECRET_KEY not found in environment variables');
    stripe = new Stripe('sk_test_placeholder_build', { apiVersion: '2024-12-18.acacia' });
    return stripe;
  }
  stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });
  return stripe;
}

/**
 * Create a Stripe checkout session
 * @param {Object} params - Checkout session parameters
 * @param {string} params.customerId - Stripe customer ID (optional)
 * @param {string} params.priceId - Stripe price ID
 * @param {string} params.userId - User UUID
 * @param {string} params.successUrl - Success redirect URL
 * @param {string} params.cancelUrl - Cancel redirect URL
 * @returns {Promise<Stripe.Checkout.Session>}
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  userId,
  successUrl,
  cancelUrl,
}) {
  try {
    const sessionParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId,
      },
    };

    // Add customer if exists, otherwise create customer on checkout
    if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = null; // Will be collected during checkout
    }

    const session = await getStripe().checkout.sessions.create(sessionParams);
    return session;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Create or retrieve Stripe customer
 * @param {string} email - Customer email
 * @param {string} userId - User UUID
 * @returns {Promise<Stripe.Customer>}
 */
export async function getOrCreateCustomer(email, userId) {
  try {
    // Try to find existing customer by email
    const customers = await getStripe().customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length > 0) {
      return customers.data[0];
    }

    // Create new customer
    const customer = await getStripe().customers.create({
      email: email,
      metadata: {
        userId: userId,
      },
    });

    return customer;
  } catch (error) {
    console.error('Error getting/creating customer:', error);
    throw error;
  }
}

/**
 * Get Stripe subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function getSubscription(subscriptionId) {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
}

/**
 * Cancel Stripe subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {boolean} immediately - Cancel immediately or at period end
 * @returns {Promise<Stripe.Subscription>}
 */
export async function cancelSubscription(subscriptionId, immediately = false) {
  try {
    if (immediately) {
      const subscription = await getStripe().subscriptions.cancel(subscriptionId);
      return subscription;
    } else {
      const subscription = await getStripe().subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
      return subscription;
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Resume Stripe subscription
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function resumeSubscription(subscriptionId) {
  try {
    const subscription = await getStripe().subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

/**
 * Update Stripe subscription (change plan)
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {string} newPriceId - New Stripe price ID
 * @returns {Promise<Stripe.Subscription>}
 */
export async function updateSubscription(subscriptionId, newPriceId) {
  try {
    const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
    
    const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });

    return updatedSubscription;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Verify Stripe webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @returns {Stripe.Event} Verified event
 */
export function verifyWebhookSignature(payload, signature) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  try {
    const event = getStripe().webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    );
    return event;
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw error;
  }
}

export { getStripe };
