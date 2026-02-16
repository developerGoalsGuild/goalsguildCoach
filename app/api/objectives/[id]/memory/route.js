import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db';

// GET - Buscar histórico de resumos diários de um objetivo
export async function GET(request, { params }) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const objectiveId = params.id;

    // Verificar se objetivo pertence ao usuário
    const objectiveResult = await pool.query(
      'SELECT session_id FROM nlp_objectives WHERE id = $1',
      [objectiveId]
    );

    if (objectiveResult.rows.length === 0 || objectiveResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Buscar entradas de journal associadas ao objetivo
    const result = await pool.query(`
      SELECT 
        id,
        entry_type,
        content,
        mood,
        created_at
      FROM quest_journal
      WHERE quest_id = $1
        AND entry_type IN ('daily_checkin', 'objective_note')
      ORDER BY created_at DESC
      LIMIT 50
    `, [objectiveId]);

    // Parse JSON content
    const entries = result.rows.map(row => ({
      ...row,
      content: typeof row.content === 'string' ? JSON.parse(row.content) : row.content
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching objective memory:', error);
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 });
  }
}
