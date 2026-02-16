import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getAuthToken, verifyJWT } from '../../../lib/auth';
import { TABLES, COLS } from '../../../lib/db-schema';

// PATCH milestone (title, description, order_index, or status/reflection for completion)
export async function PATCH(request, context) {
  try {
    const { id: milestoneId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;
    const body = await request.json();
    const { status, reflection, title, description, order_index } = body;

    // Verificar ownership e estado atual
    const checkResult = await pool.query(
      `SELECT m.id, m.quest_id, m.title, m.status FROM ${TABLES.milestones} m
       JOIN quests q ON m.quest_id::text = q.id::text
       WHERE m.id::text = $1::text AND q.${COLS.questsUser} = $2::text`,
      [String(milestoneId), userId]
    );
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const current = checkResult.rows[0];
    if (current.status === 'completed') {
      return NextResponse.json({ error: 'Completed milestones cannot be updated' }, { status: 400 });
    }

    const hasContentUpdate = title !== undefined || description !== undefined || order_index !== undefined;
    const hasStatusUpdate = typeof status === 'string';

    if (!hasContentUpdate && !hasStatusUpdate) {
      const noop = await pool.query(
        `SELECT * FROM ${TABLES.milestones} WHERE id::text = $1`,
        [String(milestoneId)]
      );
      return NextResponse.json({ milestone: noop.rows[0] });
    }

    const updates = [];
    const values = [];
    let param = 1;

    if (title !== undefined) {
      const t = String(title).trim();
      if (!t) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
      updates.push(`title = $${param++}`);
      values.push(t);
    }
    if (description !== undefined) {
      updates.push(`description = $${param++}`);
      values.push(description == null ? '' : String(description));
    }
    if (order_index !== undefined) {
      updates.push(`order_index = $${param++}`);
      values.push(typeof order_index === 'number' ? order_index : parseInt(order_index, 10) || 0);
    }
    if (hasStatusUpdate) {
      const nextStatus = status === 'completed' ? 'completed' : 'pending';
      updates.push(`status = $${param++}`);
      values.push(nextStatus);
      updates.push(`completed_at = $${param++}`);
      values.push(nextStatus === 'completed' ? new Date() : null);
    }

    values.push(milestoneId);
    const result = await pool.query(
      `UPDATE ${TABLES.milestones} SET ${updates.join(', ')} WHERE id::text = $${param} RETURNING *`,
      values
    );
    const milestone = result.rows[0];

    if (hasStatusUpdate && status === 'completed' && milestone?.quest_id) {
      try {
        const content = JSON.stringify({
          type: 'milestone_completed',
          milestone_title: milestone.title,
          milestone_id: milestone.id,
          completed_at: milestone.completed_at,
          ...(reflection && typeof reflection === 'string' && reflection.trim() && { reflection: reflection.trim() })
        });
        await pool.query(
          `INSERT INTO quest_journal (quest_id, entry_type, content, created_at)
           VALUES ($1::text, $2, $3, NOW())`,
          [milestone.quest_id, 'milestone_completed', content]
        );
      } catch (e) {
        console.warn('[Milestone] quest_journal update skipped:', e.message);
      }
    }

    return NextResponse.json({ milestone });
  } catch (error) {
    console.error('Milestone update error:', error);
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

// DELETE milestone
export async function DELETE(request, context) {
  try {
    const { id: milestoneId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const checkResult = await pool.query(
      `SELECT 1 FROM ${TABLES.milestones} m JOIN quests q ON m.quest_id::text = q.id::text WHERE m.id::text = $1::text AND q.${COLS.questsUser} = $2::text`,
      [String(milestoneId), userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    await pool.query(
      `DELETE FROM ${TABLES.milestones} WHERE id::text = $1::text`,
      [String(milestoneId)]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Milestone deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
