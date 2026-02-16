import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getAuthToken, verifyJWT } from '../../../lib/auth';
import { TABLES, COLS } from '../../../lib/db-schema';

export async function GET(request, context) {
  try {
    const { id: taskId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const result = await pool.query(
      `SELECT t.*, q.title as quest_title
       FROM ${TABLES.tasks} t
       LEFT JOIN quests q ON t.quest_id::text = q.id::text
       WHERE t.id = $1 AND t.${COLS.questsUser} = $2::text
       LIMIT 1`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Task fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const { id: taskId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const payload = await request.json();
    const { status, observation, title, description, quest_id, estimated_hours } = payload;

    const currentTaskResult = await pool.query(
      `SELECT * FROM ${TABLES.tasks} WHERE id = $1 AND ${COLS.questsUser} = $2::text LIMIT 1`,
      [taskId, userId]
    );

    if (currentTaskResult.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const currentTask = currentTaskResult.rows[0];

    // Do not allow updating completed tasks
    if (currentTask.status === 'completed') {
      return NextResponse.json({ error: 'Completed tasks cannot be updated' }, { status: 400 });
    }

    const hasStatusUpdate = typeof status === 'string';
    const hasContentUpdate =
      title !== undefined || description !== undefined || quest_id !== undefined || estimated_hours !== undefined;

    if (!hasStatusUpdate && !hasContentUpdate) {
      return NextResponse.json({ task: currentTask });
    }

    if (hasStatusUpdate && !['pending', 'completed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const nextTitle = title !== undefined ? String(title).trim() : currentTask.title;
    if (!nextTitle) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const nextDescription = description !== undefined ? description || '' : currentTask.description || '';
    const nextQuestId = quest_id !== undefined ? quest_id || null : currentTask.quest_id || null;
    const nextEstimatedHours = estimated_hours !== undefined ? estimated_hours || null : currentTask.estimated_hours || null;
    const nextStatus = hasStatusUpdate ? status : currentTask.status;
    const nextCompletedAt = nextStatus === 'completed' ? new Date() : null;

    const result = await pool.query(
      `UPDATE ${TABLES.tasks}
       SET title = $1,
           description = $2,
           quest_id = $3::text,
           estimated_hours = $4,
           status = $5,
           completed_at = $6
       WHERE id = $7 AND ${COLS.questsUser} = $8::text
       RETURNING *`,
      [nextTitle, nextDescription, nextQuestId, nextEstimatedHours, nextStatus, nextCompletedAt, taskId, userId]
    );

    const task = result.rows[0];

    // Ao completar: atualizar memória (quest_journal) para aparecer no histórico do objetivo
    if (nextStatus === 'completed' && currentTask.status !== 'completed' && task.quest_id) {
      try {
        const content = JSON.stringify({
          type: 'task_completed',
          task_title: task.title,
          task_id: task.id,
          completed_at: task.completed_at,
          ...(observation && typeof observation === 'string' && observation.trim() && { observation: observation.trim() })
        });
        await pool.query(
          `INSERT INTO quest_journal (quest_id, entry_type, content, created_at)
           VALUES ($1::text, $2, $3, NOW())`,
          [task.quest_id, 'task_completed', content]
        );
      } catch (e) {
        console.warn('[Task] quest_journal update skipped:', e.message);
      }
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error('Task update error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const { id: taskId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    await pool.query(
      `DELETE FROM ${TABLES.tasks} WHERE id = $1 AND ${COLS.questsUser} = $2::text`,
      [taskId, userId]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Task deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
