import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';

// POST - Criar lembrete automático para objetivo (tabela unificada goals)
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { objectiveId, frequency, type } = await request.json();
    
    if (!objectiveId || !frequency) {
      return NextResponse.json({ error: 'Objective ID and frequency are required' }, { status: 400 });
    }

    const pool = getPool();
    const sessionId = user.userId;

    // Calcular próximo check-in baseado na frequência
    const now = new Date();
    let nextCheckIn = new Date();

    switch (frequency) {
      case 'daily':
        nextCheckIn.setDate(now.getDate() + 1);
        nextCheckIn.setHours(9, 0, 0, 0); // 9h da manhã
        break;
      case 'weekly':
        nextCheckIn.setDate(now.getDate() + 7);
        nextCheckIn.setHours(9, 0, 0, 0);
        break;
      case 'biweekly':
        nextCheckIn.setDate(now.getDate() + 14);
        nextCheckIn.setHours(9, 0, 0, 0);
        break;
      default:
        return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 });
    }

    // Criar lembrete (schema-working: session_id, objective_id, frequency, time, active)
    const result = await pool.query(`
      INSERT INTO objective_reminders (
        session_id,
        objective_id,
        frequency,
        time,
        active
      ) VALUES ($1::text, $2::text, $3, $4::time, $5)
      RETURNING id
    `, [sessionId, objectiveId, frequency, '09:00', true]);

    return NextResponse.json({
      success: true,
      reminderId: result.rows[0].id,
      nextCheckIn,
      message: 'Lembrete configurado!'
    });

  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

// GET - Listar lembretes do usuário (tabela unificada goals)
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = user.userId;
    
    const result = await pool.query(`
      SELECT 
        r.id,
        r.objective_id,
        g.title as statement,
        r.frequency,
        r.time,
        r.active
      FROM objective_reminders r
      INNER JOIN goals g ON r.objective_id::text = g.id::text
      WHERE r.session_id = $1::text AND r.active = true
      ORDER BY r.id ASC
    `, [sessionId]);

    // Calcular next_check_in para exibição (schema-working não tem essa coluna)
    const now = new Date();
    const reminders = result.rows.map(r => {
      let next = new Date(now);
      if (r.frequency === 'daily') next.setDate(now.getDate() + 1);
      else if (r.frequency === 'weekly') next.setDate(now.getDate() + 7);
      else if (r.frequency === 'biweekly') next.setDate(now.getDate() + 14);
      next.setHours(9, 0, 0, 0);
      return { ...r, next_check_in: next, reminder_type: 'check-in', status: 'active' };
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

// DELETE - Remover lembrete
export async function DELETE(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const reminderId = searchParams.get('id');

    if (!reminderId) {
      return NextResponse.json({ error: 'Reminder ID is required' }, { status: 400 });
    }

    const pool = getPool();
    const sessionId = user.userId;

    // Verificar se lembrete pertence ao usuário
    const checkResult = await pool.query(
      'SELECT session_id FROM objective_reminders WHERE id = $1',
      [reminderId]
    );

    if (checkResult.rows.length === 0 || checkResult.rows[0].session_id !== sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await pool.query('DELETE FROM objective_reminders WHERE id = $1', [reminderId]);

    return NextResponse.json({ success: true, message: 'Lembrete removido!' });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
