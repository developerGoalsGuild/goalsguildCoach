/**
 * GET /api/subscription/plans
 * Get all available subscription plans
 */

import { NextResponse } from 'next/server';
import { getAllPlans } from '../../../lib/subscription.js';

export async function GET(request) {
  try {
    const plans = await getAllPlans();

    // Format plans for frontend (exclude internal fields)
    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      display_name: plan.display_name,
      price_monthly: parseFloat(plan.price_monthly),
      price_yearly: plan.price_yearly ? parseFloat(plan.price_yearly) : null,
      currency: plan.currency,
      features: {
        max_quests: plan.max_quests,
        max_tasks_per_quest: plan.max_tasks_per_quest,
        max_daily_messages: plan.max_daily_messages,
        max_personas: plan.max_personas,
        max_objectives_ai_per_month: plan.max_objectives_ai_per_month,
        max_quests_ai_per_month: plan.max_quests_ai_per_month,
        max_quests_manual: plan.max_quests_manual,
        advanced_analytics: plan.advanced_analytics,
        data_export: plan.data_export,
        priority_support: plan.priority_support,
      },
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error('Error getting plans:', error);
    return NextResponse.json(
      { error: 'Failed to get plans' },
      { status: 500 }
    );
  }
}
