import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { analyzeProductivityPatterns, predictObjectiveCompletion, generateAIInsights, formatInsightsAsText } from '../../lib/insights';

// GET - Buscar insights do usuário
export async function GET(request) {
  const { getAuthToken } = require('../../lib/auth');
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verifyJWT } = require('../../lib/auth');
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }

  try {
    const sessionId = decoded.sessionId;
    const insights = await generateAIInsights(sessionId);

    return NextResponse.json(insights);
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}

// POST - Forçar geração de insights
export async function POST(request) {
  const { getAuthToken } = require('../../lib/auth');
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verifyJWT } = require('../../lib/auth');
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }

  try {
    const sessionId = decoded.sessionId;
    const insights = await generateAIInsights(sessionId);

    return NextResponse.json({
      success: true,
      insights,
      message: '✨ Insights gerados com sucesso!'
    });
  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
