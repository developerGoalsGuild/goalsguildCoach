import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth';
import { setUserBudget } from '../../../lib/cost-tracking';

/**
 * POST /api/cost/budget
 * Definir orçamento mensal do usuário
 */
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.userId;

  try {
    const { monthlyBudget } = await request.json();
    
    if (!monthlyBudget || monthlyBudget <= 0) {
      return NextResponse.json({ 
        error: 'Invalid budget amount' 
      }, { status: 400 });
    }

    const result = await setUserBudget(userId, monthlyBudget);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Budget updated successfully',
        data: {
          userId,
          monthlyBudget
        }
      });
    } else {
      return NextResponse.json({
        error: 'Failed to set budget',
        details: result.error
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Budget error:', error);
    return NextResponse.json({ 
      error: 'Failed to set budget',
      details: error.message 
    }, { status: 500 });
  }
}

/**
 * GET /api/cost/budget
 * Obter orçamento atual do usuário
 */
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.userId;

  try {
    const pool = require('../../../lib/db').getPool();
    
    const result = await pool.query(
      'SELECT monthly_budget, alert_threshold_percentage, last_reset_date FROM user_budgets WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          hasBudget: false,
          monthlyBudget: null
        }
      });
    }

    const { monthly_budget, alert_threshold_percentage, last_reset_date } = result.rows[0];
    
    // Buscar custo do mês atual
    const { getUserMonthlyCost } = require('../../../lib/cost-tracking');
    const currentCost = await getUserMonthlyCost(userId);

    return NextResponse.json({
      success: true,
      data: {
        hasBudget: true,
        monthlyBudget: parseFloat(monthly_budget),
        alertThreshold: alert_threshold_percentage,
        lastResetDate: last_reset_date,
        currentCost,
        remaining: parseFloat(monthly_budget) - currentCost,
        usagePercentage: (currentCost / parseFloat(monthly_budget)) * 100
      }
    });

  } catch (error) {
    console.error('Budget fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch budget',
      details: error.message 
    }, { status: 500 });
  }
}
