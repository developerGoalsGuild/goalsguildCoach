import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getUserFromToken } from '../../../lib/auth';

// GET - Buscar objetivo completo por ID (tabela unificada goals)
export async function GET(request, { params }) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: objectiveId } = await params;
    const pool = getPool();
    const sessionId = user.userId;

    const result = await pool.query(`
      SELECT 
        id,
        session_id,
        title,
        description,
        target_date,
        progress,
        status,
        category,
        statement,
        nlp_criteria_positive,
        nlp_criteria_sensory,
        nlp_criteria_compelling,
        nlp_criteria_ecology,
        nlp_criteria_self_initiated,
        nlp_criteria_context,
        nlp_criteria_resources,
        nlp_criteria_evidence,
        is_nlp_complete,
        created_at
      FROM goals
      WHERE id = $1 AND session_id = $2
    `, [objectiveId, sessionId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Objective not found' }, { status: 404 });
    }

    return NextResponse.json({ objective: result.rows[0] });
  } catch (error) {
    console.error('Error fetching objective:', error);
    return NextResponse.json({ error: 'Failed to fetch objective' }, { status: 500 });
  }
}

// PATCH - Atualizar objetivo (tabela unificada goals)
export async function PATCH(request, { params }) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: objectiveId } = await params;
    const body = await request.json();
    const pool = getPool();
    const sessionId = user.userId;

    // Verificar se objetivo pertence ao usuário
    const checkResult = await pool.query(
      'SELECT session_id FROM goals WHERE id = $1',
      [objectiveId]
    );

    if (checkResult.rows.length === 0 || checkResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Atualizar objetivo
    await pool.query(`
      UPDATE goals
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        target_date = COALESCE($3, target_date),
        category = COALESCE($4, category),
        nlp_criteria_positive = COALESCE($5, nlp_criteria_positive),
        nlp_criteria_sensory = COALESCE($6, nlp_criteria_sensory),
        nlp_criteria_compelling = COALESCE($7, nlp_criteria_compelling),
        nlp_criteria_ecology = COALESCE($8, nlp_criteria_ecology),
        nlp_criteria_self_initiated = COALESCE($9, nlp_criteria_self_initiated),
        nlp_criteria_context = COALESCE($10, nlp_criteria_context),
        nlp_criteria_resources = COALESCE($11, nlp_criteria_resources),
        nlp_criteria_evidence = COALESCE($12, nlp_criteria_evidence),
        is_nlp_complete = COALESCE($13, is_nlp_complete)
      WHERE id = $14
    `, [
      body.title,
      body.description,
      body.target_date,
      body.category,
      body.nlp_criteria_positive,
      body.nlp_criteria_sensory,
      body.nlp_criteria_compelling,
      body.nlp_criteria_ecology,
      body.nlp_criteria_self_initiated,
      body.nlp_criteria_context,
      body.nlp_criteria_resources,
      body.nlp_criteria_evidence,
      body.is_nlp_complete,
      objectiveId
    ]);

    return NextResponse.json({ success: true, message: 'Objetivo atualizado!' });
  } catch (error) {
    console.error('Error updating objective:', error);
    return NextResponse.json({ error: 'Failed to update objective' }, { status: 500 });
  }
}

// DELETE - Deletar objetivo (tabela unificada goals)
export async function DELETE(request, { params }) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: objectiveId } = await params;
    const pool = getPool();
    const sessionId = user.userId;

    // Verificar se objetivo pertence ao usuário
    const checkResult = await pool.query(
      'SELECT session_id FROM goals WHERE id = $1',
      [objectiveId]
    );

    if (checkResult.rows.length === 0 || checkResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Deletar objetivo
    await pool.query('DELETE FROM goals WHERE id = $1', [objectiveId]);

    return NextResponse.json({ success: true, message: 'Objetivo deletado!' });
  } catch (error) {
    console.error('Error deleting objective:', error);
    return NextResponse.json({ error: 'Failed to delete objective' }, { status: 500 });
  }
}
