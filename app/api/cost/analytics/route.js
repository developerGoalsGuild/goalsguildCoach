import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '../../../lib/auth';
import { 
  getUserTotalCost, 
  getUserMonthlyCost, 
  getUserCostAnalytics,
  getCostByModel 
} from '../../../lib/cost-tracking';

/**
 * GET /api/cost/analytics
 * Obter analytics de custos do usuário
 */
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.userId;

  try {
    // Buscar parâmetros da query
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Buscar analytics
    const analytics = await getUserCostAnalytics(userId, days);
    const costByModel = await getCostByModel(userId, days);
    const monthlyCost = await getUserMonthlyCost(userId);
    const totalCost = await getUserTotalCost(userId);

    return NextResponse.json({
      success: true,
      data: {
        totalCost,
        monthlyCost,
        period: {
          days,
          startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        },
        analytics,
        costByModel,
        summary: {
          totalRequests: analytics.reduce((sum, day) => sum + parseInt(day.requests), 0),
          totalTokens: analytics.reduce((sum, day) => sum + parseInt(day.tokens), 0),
          averageDailyCost: analytics.length > 0 
            ? analytics.reduce((sum, day) => sum + parseFloat(day.cost), 0) / analytics.length 
            : 0
        }
      }
    });

  } catch (error) {
    console.error('Cost analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch cost analytics',
      details: error.message 
    }, { status: 500 });
  }
}
