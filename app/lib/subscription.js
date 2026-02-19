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
      // Return free plan as default
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
        max_quests: 1,
        max_tasks_per_quest: 10,
        max_daily_messages: 20,
        max_personas: 1,
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
 * @param {string} feature - Feature name ('quests', 'tasks', 'messages')
 * @param {number} currentUsage - Current usage count
 * @returns {Promise<{allowed: boolean, limit: number|null, remaining: number|null, message?: string}>}
 */
export async function checkSubscriptionLimit(userId, feature, currentUsage = 0) {
  const subscription = await getUserSubscription(userId);
  
  let limit = null;
  let limitField = null;
  
  switch (feature) {
    case 'quests':
      limit = subscription.max_quests;
      limitField = 'max_quests';
      break;
    case 'tasks':
      limit = subscription.max_tasks_per_quest;
      limitField = 'max_tasks_per_quest';
      break;
    case 'messages':
      limit = subscription.max_daily_messages;
      limitField = 'max_daily_messages';
      break;
    default:
      return { allowed: true, limit: null, remaining: null };
  }
  
  // NULL limit means unlimited
  if (limit === null) {
    return { allowed: true, limit: null, remaining: null };
  }
  
  const remaining = Math.max(0, limit - currentUsage);
  const allowed = currentUsage < limit;
  
  return {
    allowed,
    limit,
    remaining,
    message: allowed 
      ? null 
      : `You've reached your ${feature} limit (${limit}). Upgrade to Premium for unlimited access.`
  };
}

/**
 * Get user's quest count
 * @param {string} userId - User UUID
 * @returns {Promise<number>} Number of active quests
 */
export async function getUserQuestCount(userId) {
  const pool = getPool();
  
  try {
    const result = await pool.query(
      `SELECT COUNT(*)::int as count FROM quests WHERE user_id = $1 AND status != 'archived'`,
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
  
  // Get task count for active quest
  let taskCount = 0;
  try {
    const pool = getPool();
    const activeQuestResult = await pool.query(
      `SELECT id FROM quests WHERE user_id = $1 AND status = 'active' LIMIT 1`,
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
      remaining: subscription.max_quests === null 
        ? null 
        : Math.max(0, subscription.max_quests - questCount)
    },
    tasks: {
      current: taskCount,
      limit: subscription.max_tasks_per_quest,
      remaining: subscription.max_tasks_per_quest === null 
        ? null 
        : Math.max(0, subscription.max_tasks_per_quest - taskCount)
    },
    messages: {
      current: messageCount,
      limit: subscription.max_daily_messages,
      remaining: subscription.max_daily_messages === null 
        ? null 
        : Math.max(0, subscription.max_daily_messages - messageCount)
    },
    plan: {
      name: subscription.plan_name,
      display_name: subscription.display_name
    }
  };
}
