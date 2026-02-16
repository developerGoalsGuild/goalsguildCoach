import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';

// GET - Buscar objetivo completo por ID
export async function GET(request, { params }) {
  const user = getUserFromToken(request);
  const sessionId = user?.userId;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        o.id,
        o.status,
        o.created_at,
        o.updated_at,
        d.*
      FROM nlp_objectives o
      INNER JOIN nlp_objective_details d ON o.id = d.objective_id
      WHERE o.id = $1 AND o.session_id = $2
    `, [params.id, sessionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    return NextResponse.json({ objective: result.rows[0] });
  } catch (error) {
    console.error('Error fetching objective:', error);
    return NextResponse.json({ error: 'Failed to fetch objective' }, { status: 500 });
  }
}

// PATCH - Atualizar objetivo
export async function PATCH(request, { params }) {
  const user = getUserFromToken(request);
  const sessionId = user?.userId;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const pool = getPool();

    // Verificar se objetivo pertence ao usuário
    const checkResult = await pool.query(
      'SELECT session_id FROM nlp_objectives WHERE id = $1',
      [params.id]
    );

    if (checkResult.rows.length === 0 || checkResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Atualizar detalhes
    await pool.query(`
      UPDATE nlp_objective_details
      SET 
        statement = COALESCE($1, statement),
        context_when = COALESCE($2, context_when),
        context_where = COALESCE($3, context_where),
        context_who = COALESCE($4, context_who),
        sensory_visual = COALESCE($5, sensory_visual),
        sensory_auditory = COALESCE($6, sensory_auditory),
        sensory_kinesthetic = COALESCE($7, sensory_kinesthetic),
        compelling_factor = COALESCE($8, compelling_factor),
        self_initiated_control = COALESCE($9, self_initiated_control),
        evidence_i_will_know = COALESCE($10, evidence_i_will_know),
        timeline_target = COALESCE($11, timeline_target),
        updated_at = CURRENT_TIMESTAMP
      WHERE objective_id = $12
    `, [
      body.statement,
      body.context_when,
      body.context_where,
      body.context_who,
      body.sensory_visual,
      body.sensory_auditory,
      body.sensory_kinesthetic,
      body.compelling_factor,
      body.self_initiated_control,
      body.evidence_i_will_know,
      body.timeline_target,
      params.id
    ]);

    return NextResponse.json({ success: true, message: 'Objetivo atualizado!' });
  } catch (error) {
    console.error('Error updating objective:', error);
    return NextResponse.json({ error: 'Failed to update objective' }, { status: 500 });
  }
}

// DELETE - Deletar objetivo
export async function DELETE(request, { params }) {
  const user = getUserFromToken(request);
  const sessionId = user?.userId;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();

    // Verificar se objetivo pertence ao usuário
    const checkResult = await pool.query(
      'SELECT session_id FROM nlp_objectives WHERE id = $1',
      [params.id]
    );

    if (checkResult.rows.length === 0 || checkResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deletar (cascade vai deletar os detalhes também)
    await pool.query('DELETE FROM nlp_objectives WHERE id = $1', [params.id]);

    return NextResponse.json({ success: true, message: 'Objetivo deletado!' });
  } catch (error) {
    console.error('Error deleting objective:', error);
    return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 });
  }
}
