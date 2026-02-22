/**
 * Subscription Management Library
 * Handles subscription checks, limits, and usage tracking
 */

import { getPool } from './db.js';

/**
 * Get user's active subscription
 * @param {string} userId - User UUID
 * @returns {Promise<Object|null>} Subscription object or null
 */
export async function getUserSubscription(userId) {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT 
        us.*,
        sp.name as plan_name,
        sp.display_name,
        sp.max_quests,
        sp.max_tasks_per_quest,
        sp.max_daily_messages,
        sp.max_personas,
        sp.max_objectives_ai_per_month,
        sp.max_quests_ai_per_month,
        sp.max_quests_manual,
        sp.advanced_analytics,
        sp.data_export,
        sp.priority_support
      FROM user_subscriptions us
      JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1
        AND us.status = 'active'
        AND us.current_period_end > CURRENT_TIMESTAMP
      ORDER BY us.created_at DESC
      LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // No active paid subscription: use user's chosen plan (default_plan_id) or free
      const userPlan = await pool.query(
        `SELECT default_plan_id FROM users WHERE id = $1`,
        [userId]
      );
      const defaultPlanId = userPlan.rows[0]?.default_plan_id;
      if (defaultPlanId) {
        const planRow = await pool.query(
          `SELECT * FROM subscription_plans WHERE id = $1`,
          [defaultPlanId]
        );
        if (planRow.rows.length > 0) {
          return {
            ...planRow.rows[0],
            plan_name: planRow.rows[0].name,
            status: 'active'
          };
        }
      }
      return await getDefaultPlan();
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error getting user subscription:', error);
    return await getDefaultPlan();
  }
}

/**
 * Get default (free) plan
 * @returns {Promise<Object>} Free plan object
 */
export async function getDefaultPlan() {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT * FROM subscription_plans WHERE name = 'free' LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      // Fallback if free plan doesn't exist
      return {
        id: null,
        plan_name: 'free',
        display_name: 'Free',
        max_quests: null,
        max_tasks_per_quest: null,
        max_daily_messages: null,
        max_personas: 1,
        max_objectives_ai_per_month: 2,
        max_quests_ai_per_month: 2,
        max_quests_manual: 10,
        advanced_analytics: false,
        data_export: false,
        priority_support: false,
        status: 'active'
      };
    }
    
    return {
      ...result.rows[0],
      plan_name: result.rows[0].name,
      status: 'active'
    };
  } catch (error) {
    console.error('Error getting default plan:', error);
    throw error;
  }
}

/**
 * Check if user can perform an action based on subscription limits
 * @param {string} userId - User UUID
 * @param {string} feature - Feature name ('quests', 'tasks', 'messages', 'objectives_ai', 'quests_ai', 'quests_manual')
 * @param {number} currentUsage - Current usage count (optional; for objectives_ai/quests_ai/quests_manual we fetch if not provided)
 * @returns {Promise<{allowed: boolean, limit: number|null, remaining: number|null, message?: string}>}
 */
export async function checkSubscriptionLimit(userId, feature, currentUsage = undefined) {
  const subscription = await getUserSubscription(userId);

  let limit = null;
  let current = currentUsage;

  if (feature === 'objectives_ai') {
    limit = subscription.max_objectives_ai_per_month ?? undefined;
    if (current === undefined) current = await getObjectivesAiCountThisMonth(userId);
  } else if (feature === 'quests_ai') {
    limit = subscription.max_quests_ai_per_month ?? undefined;
    if (current === undefined) current = await getQuestsAiCountThisMonth(userId);
  } else if (feature === 'quests_manual') {
    limit = subscription.max_quests_manual ?? undefined;
    if (current === undefined) current = await getQuestsManualCount(userId);
  } else if (feature === 'quests') {
    limit = subscription.max_quests;
  } else if (feature === 'tasks') {
    limit = subscription.max_tasks_per_quest;
  } else if (feature === 'messages') {
    limit = subscription.max_daily_messages;
  } else {
    return { allowed: true, limit: null, remaining: null };
  }

  if (current === undefined) current = 0;
  if (limit === null || limit === undefined) {
    return { allowed: true, limit: null, remaining: null };
  }

  const remaining = Math.max(0, limit - current);
  const allowed = current < limit;

  const upgradeMsg = 'Upgrade your plan for more.';
  const message = allowed ? null : `You've reached your ${feature} limit (${limit}). ${upgradeMsg}`;

  return { allowed, limit, remaining, message };
}

/**
 * Count objectives (goals) created by AI this month for user
 * @param {string} userId - User UUID (stored as session_id or user_id in goals)
 */
export async function getObjectivesAiCountThisMonth(userId) {
  const pool = getPool();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goals' AND column_name IN ('user_id', 'session_id')`
    );
    const hasUserId = cols.rows.some((r) => r.column_name === 'user_id');
    const hasSessionId = cols.rows.some((r) => r.column_name === 'session_id');
    const userCol = hasUserId ? 'user_id' : 'session_id';
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM goals WHERE ${userCol}::text = $1 AND COALESCE(created_by_ai, false) = true AND created_at >= $2::date`,
      [userId, startOfMonth]
    );
    return result.rows[0]?.count ?? 0;
  } catch (e) {
    console.error('Error getObjectivesAiCountThisMonth:', e);
    return 0;
  }
}

/**
 * Count quests created by AI this month for user
 */
export async function getQuestsAiCountThisMonth(userId) {
  const pool = getPool();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('user_id', 'session_id')`
    );
    const hasUserId = cols.rows.some((r) => r.column_name === 'user_id');
    const userCol = hasUserId ? 'user_id' : 'session_id';
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM quests WHERE ${userCol}::text = $1 AND COALESCE(created_by_ai, false) = true AND created_at >= $2::date`,
      [userId, startOfMonth]
    );
    return result.rows[0]?.count ?? 0;
  } catch (e) {
    console.error('Error getQuestsAiCountThisMonth:', e);
    return 0;
  }
}

/**
 * Count quests created manually (not by AI) for user (all time for free cap)
 */
export async function getQuestsManualCount(userId) {
  const pool = getPool();
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('user_id', 'session_id')`
    );
    const hasUserId = cols.rows.some((r) => r.column_name === 'user_id');
    const userCol = hasUserId ? 'user_id' : 'session_id';
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM quests WHERE ${userCol}::text = $1 AND (created_by_ai = false OR created_by_ai IS NULL)`,
      [userId]
    );
    return result.rows[0]?.count ?? 0;
  } catch (e) {
    console.error('Error getQuestsManualCount:', e);
    return 0;
  }
}

/**
 * Get user's quest count
 * @param {string} userId - User UUID
 * @returns {Promise<number>} Number of active quests
 */
export async function getUserQuestCount(userId) {
  const pool = getPool();
  try {
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('user_id', 'session_id')`
    );
    const userCol = cols.rows.some((r) => r.column_name === 'user_id') ? 'user_id' : 'session_id';
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM quests WHERE ${userCol}::text = $1 AND (status IS NULL OR status != 'archived')`,
      [userId]
    );
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error getting quest count:', error);
    return 0;
  }
}

/**
 * Get user's task count for a specific quest
 * @param {string} userId - User UUID
 * @param {string} questId - Quest UUID
 * @returns {Promise<number>} Number of tasks in quest
 */
export async function getQuestTaskCount(userId, questId) {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM tasks WHERE user_id = $1 AND quest_id = $2`,
      [userId, questId]
    );
    
    return result.rows[0]?.count || 0;
  } catch (error) {
    console.error('Error getting task count:', error);
    return 0;
  }
}

/**
 * Get user's daily message count
 * @param {string} userId - User UUID
 * @param {Date} date - Date to check (defaults to today)
 * @returns {Promise<number>} Number of messages sent today
 */
export async function getDailyMessageCount(userId, date = new Date()) {
  const pool = getPool();
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    const result = await pool.query(
      `SELECT message_count FROM daily_message_usage 
       WHERE user_id = $1 AND date = $2`,
      [userId, dateStr]
    );
    
    return result.rows[0]?.message_count || 0;
  } catch (error) {
    console.error('Error getting daily message count:', error);
    return 0;
  }
}

/**
 * Increment daily message usage
 * @param {string} userId - User UUID
 * @param {Date} date - Date (defaults to today)
 * @returns {Promise<number>} New message count
 */
export async function incrementDailyMessageUsage(userId, date = new Date()) {
  const pool = getPool();
  const dateStr = date.toISOString().split('T')[0];
  
  try {
    const result = await pool.query(
      `INSERT INTO daily_message_usage (user_id, date, message_count)
       VALUES ($1, $2, 1)
       ON CONFLICT (user_id, date)
       DO UPDATE SET message_count = daily_message_usage.message_count + 1,
                     updated_at = CURRENT_TIMESTAMP
       RETURNING message_count`,
      [userId, dateStr]
    );
    
    return result.rows[0]?.message_count || 0;
  } catch (error) {
    console.error('Error incrementing message usage:', error);
    throw error;
  }
}

/**
 * Check if user has access to a premium feature
 * @param {string} userId - User UUID
 * @param {string} feature - Feature name ('advanced_analytics', 'data_export', 'priority_support')
 * @returns {Promise<boolean>} True if user has access
 */
export async function hasFeatureAccess(userId, feature) {
  const subscription = await getUserSubscription(userId);
  
  switch (feature) {
    case 'advanced_analytics':
      return subscription.advanced_analytics === true;
    case 'data_export':
      return subscription.data_export === true;
    case 'priority_support':
      return subscription.priority_support === true;
    default:
      return false;
  }
}

/**
 * Get all available subscription plans
 * @returns {Promise<Array>} Array of subscription plans
 */
export async function getAllPlans() {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT * FROM subscription_plans ORDER BY price_monthly ASC`
    );
    
    return result.rows;
  } catch (error) {
    console.error('Error getting all plans:', error);
    return [];
  }
}

/**
 * Get usage statistics for a user
 * @param {string} userId - User UUID
 * @returns {Promise<Object>} Usage statistics
 */
export async function getUserUsageStats(userId) {
  const subscription = await getUserSubscription(userId);
  const questCount = await getUserQuestCount(userId);
  const messageCount = await getDailyMessageCount(userId);
  const objectivesAi = await getObjectivesAiCountThisMonth(userId);
  const questsAi = await getQuestsAiCountThisMonth(userId);
  const questsManual = await getQuestsManualCount(userId);

  // Get task count for active quest
  let taskCount = 0;
  try {
    const pool = getPool();
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('user_id', 'session_id')`
    );
    const userCol = cols.rows.some((r) => r.column_name === 'user_id') ? 'user_id' : 'session_id';
    const activeQuestResult = await pool.query(
      `SELECT id FROM quests WHERE ${userCol}::text = $1 AND status = 'active' LIMIT 1`,
      [userId]
    );
    if (activeQuestResult.rows.length > 0) {
      taskCount = await getQuestTaskCount(userId, activeQuestResult.rows[0].id);
    }
  } catch (error) {
    console.error('Error getting task count:', error);
  }

  return {
    quests: {
      current: questCount,
      limit: subscription.max_quests,
      remaining: subscription.max_quests === null ? null : Math.max(0, subscription.max_quests - questCount)
    },
    tasks: {
      current: taskCount,
      limit: subscription.max_tasks_per_quest,
      remaining: subscription.max_tasks_per_quest === null ? null : Math.max(0, (subscription.max_tasks_per_quest ?? 0) - taskCount)
    },
    messages: {
      current: messageCount,
      limit: subscription.max_daily_messages,
      remaining: subscription.max_daily_messages === null ? null : Math.max(0, (subscription.max_daily_messages ?? 0) - messageCount)
    },
    objectives_ai: {
      current: objectivesAi,
      limit: subscription.max_objectives_ai_per_month ?? null,
      remaining: subscription.max_objectives_ai_per_month == null ? null : Math.max(0, (subscription.max_objectives_ai_per_month ?? 0) - objectivesAi)
    },
    quests_ai: {
      current: questsAi,
      limit: subscription.max_quests_ai_per_month ?? null,
      remaining: subscription.max_quests_ai_per_month == null ? null : Math.max(0, (subscription.max_quests_ai_per_month ?? 0) - questsAi)
    },
    quests_manual: {
      current: questsManual,
      limit: subscription.max_quests_manual ?? null,
      remaining: subscription.max_quests_manual == null ? null : Math.max(0, (subscription.max_quests_manual ?? 0) - questsManual)
    },
    plan: {
      name: subscription.plan_name,
      display_name: subscription.display_name
    }
  };
}
