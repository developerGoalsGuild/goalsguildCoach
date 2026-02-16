/**
 * Sistema de Rastreamento de Custos - GoalsGuild Coach
 * 
 * Rastrea uso de tokens e custos por usuário
 */

const { getPool } = require('./db');

/**
 * Precos dos modelos OpenAI (por 1M tokens)
 * Atualizado em 2026-02-13
 */
const MODEL_PRICING = {
  // OpenAI Models
  'gpt-4o-mini': {
    provider: 'openai',
    inputPrice: 0.150,  // $0.15 per 1M input tokens
    outputPrice: 0.600, // $0.60 per 1M output tokens
    currency: 'USD'
  },
  'gpt-4o': {
    provider: 'openai',
    inputPrice: 2.500,
    outputPrice: 15.000,
    currency: 'USD'
  },
  'gpt-4-turbo': {
    provider: 'openai',
    inputPrice: 0.500,
    outputPrice: 1.500,
    currency: 'USD'
  },
  
  // Google Models (Gemini)
  'gemini-2.5-flash': {
    provider: 'google',
    inputPrice: 0.075,
    outputPrice: 0.300,
    currency: 'USD'
  },
  'gemini-2.5-pro': {
    provider: 'google',
    inputPrice: 1.250,
    outputPrice: 10.000,
    currency: 'USD'
  },
  
  // xAI Models (Grok)
  'grok-4.1': {
    provider: 'xai',
    inputPrice: 0.200,
    outputPrice: 0.500,
    currency: 'USD'
  },
  
  // DeepSeek
  'deepseek-chat': {
    provider: 'deepseek',
    inputPrice: 0.140,
    outputPrice: 0.140,
    currency: 'USD'
  },
  
  // Groq (Llama)
  'llama3-70b-8192': {
    provider: 'groq',
    inputPrice: 0.590,
    outputPrice: 0.590,
    currency: 'USD'
  }
};

/**
 * Calcular custo de tokens
 */
function calculateCost(model, inputTokens, outputTokens) {
  const pricing = MODEL_PRICING[model] || MODEL_PRICING['gpt-4o-mini'];
  
  const inputCost = (inputTokens / 1000000) * pricing.inputPrice;
  const outputCost = (outputTokens / 1000000) * pricing.outputPrice;
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Math.round(inputCost * 1000000) / 1000000,
    outputCost: Math.round(outputCost * 1000000) / 1000000,
    totalCost: Math.round(totalCost * 1000000) / 1000000,
    currency: pricing.currency
  };
}

/**
 * Registrar uso de API
 */
async function trackUsage({
  userId,
  sessionId,
  model,
  provider = 'openai',
  inputTokens = 0,
  outputTokens = 0,
  endpoint,
  responseTimeMs,
  statusCode = 200,
  errorMessage = null
}) {
  const pool = getPool();
  
  const totalTokens = inputTokens + outputTokens;
  const costs = calculateCost(model, inputTokens, outputTokens);
  
  const query = `
    INSERT INTO usage_tracking (
      session_id,
      user_id,
      model,
      provider,
      input_tokens,
      output_tokens,
      total_tokens,
      input_cost,
      output_cost,
      total_cost,
      endpoint,
      response_time_ms,
      status_code,
      error_message
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING id
  `;
  
  try {
    const result = await pool.query(query, [
      sessionId,
      userId,
      model,
      provider,
      inputTokens,
      outputTokens,
      totalTokens,
      costs.inputCost,
      costs.outputCost,
      costs.totalCost,
      endpoint,
      responseTimeMs,
      statusCode,
      errorMessage
    ]);
    
    // Atualizar resumo diário
    await updateDailySummary(userId, sessionId, model, totalTokens, costs.totalCost);
    
    // Verificar orçamento
    await checkBudgetAlert(userId);
    
    return {
      success: true,
      usageId: result.rows[0].id,
      cost: costs.totalCost
    };
  } catch (error) {
    console.error('Error tracking usage:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Atualizar resumo diário de custos
 */
async function updateDailySummary(userId, sessionId, model, tokens, cost) {
  const pool = getPool();
  const today = new Date().toISOString().split('T')[0];
  
  const query = `
    INSERT INTO daily_cost_summaries (
      user_id,
      session_id,
      summary_date,
      total_requests,
      total_input_tokens,
      total_output_tokens,
      total_tokens,
      total_cost,
      models_used
    ) VALUES ($1, $2, $3, 1, $4, $5, $6, $7, ARRAY[$8])
    ON CONFLICT (user_id, summary_date) DO UPDATE SET
      total_requests = daily_cost_summaries.total_requests + 1,
      total_tokens = daily_cost_summaries.total_tokens + $6,
      total_cost = daily_cost_summaries.total_cost + $7,
      models_used = array_append(models_used, $8),
      updated_at = NOW()
  `;
  
  try {
    await pool.query(query, [
      userId,
      sessionId,
      today,
      0, // input tokens (serão adicionados depois)
      0, // output tokens (serão adicionados depois)
      tokens,
      cost,
      model
    ]);
  } catch (error) {
    console.error('Error updating daily summary:', error);
  }
}

/**
 * Obter custo total do usuário
 */
async function getUserTotalCost(userId, startDate = null, endDate = null) {
  const pool = getPool();
  
  let query = 'SELECT SUM(total_cost) as total_cost FROM usage_tracking WHERE user_id = $1';
  const params = [userId];
  
  if (startDate) {
    query += ' AND created_at >= $2';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND created_at <= $' + (params.length + 1);
    params.push(endDate);
  }
  
  try {
    const result = await pool.query(query, params);
    return parseFloat(result.rows[0]?.total_cost || 0);
  } catch (error) {
    console.error('Error getting user total cost:', error);
    return 0;
  }
}

/**
 * Obter custos do mês atual
 */
async function getUserMonthlyCost(userId) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return getUserTotalCost(userId, firstDay.toISOString());
}

/**
 * Definir orçamento mensal do usuário
 */
async function setUserBudget(userId, monthlyBudget) {
  const pool = getPool();
  
  const query = `
    INSERT INTO user_budgets (user_id, monthly_budget)
    VALUES ($1, $2)
    ON CONFLICT (user_id) DO UPDATE SET
      monthly_budget = EXCLUDED.monthly_budget,
      updated_at = NOW()
  `;
  
  try {
    await pool.query(query, [userId, monthlyBudget]);
    return { success: true };
  } catch (error) {
    console.error('Error setting user budget:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar e enviar alerta de orçamento
 */
async function checkBudgetAlert(userId) {
  const pool = getPool();
  
  // Buscar orçamento do usuário
  const budgetQuery = 'SELECT monthly_budget, alert_threshold_percentage FROM user_budgets WHERE user_id = $1';
  const budgetResult = await pool.query(budgetQuery, [userId]);
  
  if (budgetResult.rows.length === 0) {
    return; // Sem orçamento definido
  }
  
  const { monthly_budget, alert_threshold_percentage } = budgetResult.rows[0];
  
  // Calcular custo do mês
  const monthlyCost = await getUserMonthlyCost(userId);
  const usagePercentage = (monthlyCost / monthly_budget) * 100;
  
  // Verificar se está acima do threshold
  if (usagePercentage >= alert_threshold_percentage) {
    // TODO: Enviar notificação ao usuário
    console.log(`Budget alert for user ${userId}: ${usagePercentage.toFixed(1)}% used ($${monthlyCost.toFixed(2)} of $${monthlyBudget.toFixed(2)})`);
    
    // Marcar que alerta foi enviado
    await pool.query(
      'UPDATE user_budgets SET alert_sent = TRUE WHERE user_id = $1',
      [userId]
    );
  }
}

/**
 * Obter analytics de custos do usuário
 */
async function getUserCostAnalytics(userId, days = 30) {
  const pool = getPool();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens,
      SUM(total_cost) as cost
    FROM usage_tracking
    WHERE user_id = $1
      AND created_at >= $2
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;
  
  try {
    const result = await pool.query(query, [userId, startDate.toISOString()]);
    return result.rows;
  } catch (error) {
    console.error('Error getting cost analytics:', error);
    return [];
  }
}

/**
 * Obter custos por modelo
 */
async function getCostByModel(userId, days = 30) {
  const pool = getPool();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query = `
    SELECT 
      model,
      COUNT(*) as requests,
      SUM(total_tokens) as tokens,
      SUM(total_cost) as cost
    FROM usage_tracking
    WHERE user_id = $1
      AND created_at >= $2
    GROUP BY model
    ORDER BY cost DESC
  `;
  
  try {
    const result = await pool.query(query, [userId, startDate.toISOString()]);
    return result.rows;
  } catch (error) {
    console.error('Error getting cost by model:', error);
    return [];
  }
}

module.exports = {
  trackUsage,
  getUserTotalCost,
  getUserMonthlyCost,
  setUserBudget,
  getUserCostAnalytics,
  getCostByModel,
  calculateCost,
  MODEL_PRICING
};
