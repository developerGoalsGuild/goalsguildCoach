import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';

// GET - Listar todos os objetivos do usuário
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
        o.id,
        o.status,
        o.created_at,
        o.updated_at,
        d.statement,
        d.context_when,
        d.context_where,
        d.context_who,
        d.timeline_target,
        d.evidence_i_will_know
      FROM nlp_objectives o
      LEFT JOIN nlp_objective_details d ON o.id = d.objective_id
      WHERE o.session_id = $1
      ORDER BY o.updated_at DESC
    `, [sessionId]);

    return NextResponse.json({ objectives: result.rows });
  } catch (error) {
    console.error('Error fetching objectives:', error);
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
  }
}

// POST - Criar novo objetivo NLP
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = user.userId; // Usar userId como session_id
    
    // Validar campos obrigatórios
    if (!body.statement) {
      return NextResponse.json({ error: 'Statement is required' }, { status: 400 });
    }

    const pool = getPool();

    // Criar objetivo
    const objectiveResult = await pool.query(
      'INSERT INTO nlp_objectives (session_id, status) VALUES ($1, $2) RETURNING id',
      [sessionId, 'active']
    );

    const objectiveId = objectiveResult.rows[0].id;

    // Criar detalhes do objetivo
    await pool.query(`
      INSERT INTO nlp_objective_details (
        objective_id, statement, context_when, context_where, context_who,
        sensory_visual, sensory_auditory, sensory_kinesthetic, compelling_factor,
        ecology_family_impact, ecology_family_resolution,
        ecology_health_impact, ecology_health_resolution,
        ecology_finance_impact, ecology_finance_resolution, ecology_other,
        self_initiated_control, self_initiated_not_in_control,
        resources_internal, resources_external,
        evidence_i_will_know, evidence_others_will_see, evidence_metrics,
        timeline_start, timeline_target, timeline_checkpoints, coaching_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24
      )
    `, [
      objectiveId,
      body.statement || null,
      body.context_when || null,
      body.context_where || null,
      body.context_who || null,
      body.sensory_visual || null,
      body.sensory_auditory || null,
      body.sensory_kinesthetic || null,
      body.compelling_factor || null,
      body.ecology_family_impact || null,
      body.ecology_family_resolution || null,
      body.ecology_health_impact || null,
      body.ecology_health_resolution || null,
      body.ecology_finance_impact || null,
      body.ecology_finance_resolution || null,
      body.ecology_other || null,
      body.self_initiated_control || null,
      body.self_initiated_not_in_control || null,
      body.resources_internal || null,
      body.resources_external || null,
      body.evidence_i_will_know || null,
      body.evidence_others_will_see || null,
      body.evidence_metrics || null,
      body.timeline_start || null,
      body.timeline_target || null,
      body.timeline_checkpoints || null,
      body.coaching_notes || null
    ]);

    // Buscar o objetivo criado
    const result = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.created_at,
        d.statement,
        d.timeline_target
      FROM nlp_objectives o
      LEFT JOIN nlp_objective_details d ON o.id = d.objective_id
      WHERE o.id = $1
    `, [objectiveId]);

    return NextResponse.json({ 
      objective: result.rows[0],
      message: 'Objetivo criado com sucesso!'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating objective:', error);
    return NextResponse.json({ error: 'Failed to create objective' }, { status: 500 });
  }
}
