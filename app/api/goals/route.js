import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';

// GET - Listar todos os objetivos do usuário (tabela unificada goals)
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = user.userId; // Usar userId como session_id
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        target_date,
        progress,
        status,
        category,
        is_nlp_complete,
        nlp_criteria_positive,
        nlp_criteria_sensory,
        nlp_criteria_compelling,
        nlp_criteria_ecology,
        nlp_criteria_self_initiated,
        nlp_criteria_context,
        nlp_criteria_resources,
        nlp_criteria_evidence,
        created_at
      FROM goals
      WHERE session_id = $1::text
      ORDER BY created_at DESC
    `, [sessionId]);

    return NextResponse.json({ goals: result.rows });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

// POST - Criar novo objetivo (simples ou NLP completo)
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = user.userId; // Usar userId como session_id
    
    // Validar campos obrigatórios
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const pool = getPool();

    // Criar objetivo
    const result = await pool.query(`
      INSERT INTO goals (
        session_id,
        title,
        description,
        target_date,
        category,
        is_nlp_complete,
        nlp_criteria_positive,
        nlp_criteria_sensory,
        nlp_criteria_compelling,
        nlp_criteria_ecology,
        nlp_criteria_self_initiated,
        nlp_criteria_context,
        nlp_criteria_resources,
        nlp_criteria_evidence,
        status
      ) VALUES (
        $1::text, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id, title, is_nlp_complete
    `, [
      sessionId,
      body.title,
      body.description || null,
      body.target_date || null,
      body.category || null,
      body.is_nlp_complete || false,
      body.nlp_criteria_positive || null,
      body.nlp_criteria_sensory || null,
      body.nlp_criteria_compelling || null,
      body.nlp_criteria_ecology || null,
      body.nlp_criteria_self_initiated || null,
      body.nlp_criteria_context || null,
      body.nlp_criteria_resources || null,
      body.nlp_criteria_evidence || null,
      'active'
    ]);

    const goal = result.rows[0];
    
    return NextResponse.json({ 
      goal: goal,
      message: goal.is_nlp_complete 
        ? 'Objetivo NLP completo criado!' 
        : 'Objetivo criado!'
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
