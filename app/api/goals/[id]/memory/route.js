import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../../lib/db';
import { getUserFromToken } from '../../../../lib/auth';

// GET - Buscar histórico de memory (check-ins, notas, journal) de um objetivo
export async function GET(request, { params }) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Await params antes de usar (Next.js 15+)
    const { id: objectiveId } = await params;
    
    const pool = getPool();
    const sessionId = user.userId; // Usar userId como session_id

    // Verificar se objetivo pertence ao usuário (tabela unificada goals)
    const objectiveResult = await pool.query(
      'SELECT session_id FROM goals WHERE id = $1',
      [objectiveId]
    );

    if (objectiveResult.rows.length === 0 || objectiveResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Buscar memória NLP do objetivo (resumo formatado salvo ao aprovar no Coach)
    let nlpMemory = null;
    try {
      const memResult = await pool.query(
        `SELECT memory, created_at FROM objective_memories 
         WHERE objective_id = $1 AND session_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [objectiveId, sessionId]
      );
      if (memResult.rows.length > 0) {
        nlpMemory = {
          content: memResult.rows[0].memory,
          created_at: memResult.rows[0].created_at
        };
      }
    } catch (e) {
      console.warn('[Memory] objective_memories not available:', e.message);
    }

    // Buscar entradas de journal (check-ins, notas) de quests ligadas a este objetivo
    let entries = [];
    try {
      const result = await pool.query(`
        SELECT qj.id, qj.entry_type, qj.content, qj.mood, qj.created_at
        FROM quest_journal qj
        INNER JOIN quests q ON qj.quest_id::text = q.id::text
        WHERE q.parent_goal_id::text = $1::text
        ORDER BY qj.created_at DESC
        LIMIT 50
      `, [objectiveId]);

      entries = result.rows.map(row => ({
        ...row,
        content: typeof row.content === 'string' ? (() => { try { return JSON.parse(row.content); } catch { return row.content; } })() : row.content
      }));
    } catch (e) {
      console.warn('[Memory] quest_journal query:', e.message);
    }

    return NextResponse.json({ entries, nlpMemory });
  } catch (error) {
    console.error('Error fetching objective memory:', error);
    return NextResponse.json({ error: 'Failed to fetch memory' }, { status: 500 });
  }
}
