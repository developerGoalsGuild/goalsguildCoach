import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getAuthToken, verifyJWT } from '../../../lib/auth';
import { TABLES, COLS } from '../../../lib/db-schema';

// GET quest details
export async function GET(request, context) {
  try {
    const { id: questId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    // Get quest with full details (milestones sem order_index no schema-working)
    const questResult = await pool.query(`
      SELECT q.*,
        COALESCE(
          (SELECT json_agg(json_build_object('id', m.id, 'title', m.title, 'description', m.description, 'status', m.status) ORDER BY m.created_at)
           FROM ${TABLES.milestones} m WHERE m.quest_id::text = q.id::text),
          '[]'::json
        ) as milestones,
        (SELECT COUNT(*) FILTER (WHERE m.status = 'completed') FROM ${TABLES.milestones} m WHERE m.quest_id::text = q.id::text) as milestones_completed,
        (SELECT COUNT(*) FROM ${TABLES.milestones} m WHERE m.quest_id::text = q.id::text) as milestones_total
      FROM quests q
      WHERE q.id::text = $1::text AND q.${COLS.questsUser} = $2::text
    `, [questId, userId]);

    if (questResult.rows.length === 0) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    const quest = questResult.rows[0];

    // Get all tasks for this quest (tasks_table com session_id)
    const tasksResult = await pool.query(
      `SELECT id, title, description, status, estimated_hours, completed_at, created_at FROM ${TABLES.tasks} WHERE quest_id::text = $1::text AND ${COLS.questsUser} = $2::text ORDER BY created_at ASC`,
      [questId, userId]
    );

    // Get journal entries for this quest
    const journalResult = await pool.query(
      `SELECT entry_type, content, mood, xp_earned, created_at FROM quest_journal WHERE quest_id::text = $1::text`,
      [questId]
    );

    // Get linked goals (goals usa session_id)
    const goalsResult = await pool.query(
      `SELECT id, title, description, progress, target_date FROM goals WHERE parent_quest_id::text = $1::text AND ${COLS.goalsUser} = $2::text`,
      [questId, userId]
    );

    // Get parent goal if exists
    let parentGoal = null;
    if (quest.parent_goal_id) {
      const parentGoalResult = await pool.query(
        `SELECT id, title, description FROM goals WHERE id::text = $1::text AND ${COLS.goalsUser} = $2::text`,
        [quest.parent_goal_id, userId]
      );
      parentGoal = parentGoalResult.rows[0] || null;
    }

    // Calcular completion_percentage baseado em milestones (igual à listagem)
    const milestonesCompleted = quest.milestones_completed || 0;
    const milestonesTotal = quest.milestones_total || 0;
    const completionPercentage = milestonesTotal > 0
      ? Math.round((milestonesCompleted / milestonesTotal) * 100)
      : 0;

    return NextResponse.json({
      quest: {
        ...quest,
        milestones: quest.milestones || [],
        milestones_summary: {
          completed: milestonesCompleted,
          total: milestonesTotal
        },
        completion_percentage: completionPercentage
      },
      tasks: tasksResult.rows,
      journal: journalResult.rows,
      parent_goal: parentGoal,
      computed: {
        total_tasks: tasksResult.rows.length,
        completed_tasks: tasksResult.rows.filter(t => t.status === 'completed').length,
        completion_percentage: completionPercentage, // Usar milestones, não tasks
        total_estimated_hours: tasksResult.rows.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0),
        journal_entries: journalResult.rows.length
      }
    });

  } catch (error) {
    console.error('Quest details error:', error);
    return NextResponse.json({ error: 'Failed to fetch quest details' }, { status: 500 });
  }
}

// PATCH quest
export async function PATCH(request, context) {
  try {
    const { id: questId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const existing = await pool.query(
      `SELECT status, parent_goal_id FROM quests WHERE id::text = $1::text AND ${COLS.questsUser} = $2::text LIMIT 1`,
      [questId, userId]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }
    if (existing.rows[0].status === 'completed') {
      return NextResponse.json({ error: 'Completed quests cannot be updated' }, { status: 400 });
    }
    if (existing.rows[0].status === 'cancelled') {
      return NextResponse.json({ error: 'Cancelled quests cannot be updated' }, { status: 400 });
    }

    const updates = await request.json();
    const { feeling, reflection } = updates;

    // Map numeric difficulty (1-5) to string for DB constraint
    if (updates.difficulty !== undefined) {
      const DIFFICULTY_MAP = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'hard', 5: 'epic' };
      const validStrings = ['easy', 'medium', 'hard', 'epic'];
      let d = updates.difficulty;
      if (typeof d === 'number' && d >= 1 && d <= 5) {
        updates.difficulty = DIFFICULTY_MAP[d] || 'medium';
      } else if (typeof d === 'string' && !validStrings.includes(d)) {
        updates.difficulty = 'medium';
      }
    }

    // Build update query dynamically
    const allowedFields = ['title', 'description', 'target_date', 'difficulty', 'estimated_xp', 'status'];
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    // Remover feeling e reflection dos updates (não são campos da tabela)
    delete updates.feeling;
    delete updates.reflection;

    // When marking as completed or failed, set completed_at and save to memory
    const isCompleting = updates.status === 'completed';
    const isFailing = updates.status === 'cancelled' || updates.status === 'failed';
    
    if (isCompleting || isFailing) {
      updateFields.push(`completed_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    values.push(questId, userId);

    await pool.query(
      `UPDATE quests SET ${updateFields.join(', ')} WHERE id::text = $${paramCount}::text AND ${COLS.questsUser} = $${paramCount + 1}::text`,
      values
    );

    // Salvar na memória do objetivo se houver parent_goal_id
    if ((isCompleting || isFailing) && existing.rows[0].parent_goal_id) {
      try {
        const questResult = await pool.query(
          `SELECT title, description FROM quests WHERE id::text = $1::text`,
          [questId]
        );
        const quest = questResult.rows[0];

        const journalContent = JSON.stringify({
          type: isCompleting ? 'quest_completed' : 'quest_failed',
          quest_title: quest?.title,
          quest_id: questId,
          completed_at: new Date().toISOString(),
          ...(feeling && typeof feeling === 'string' && feeling.trim() && { feeling: feeling.trim() }),
          ...(reflection && typeof reflection === 'string' && reflection.trim() && { reflection: reflection.trim() })
        });

        // Salvar no quest_journal
        await pool.query(
          `INSERT INTO quest_journal (quest_id, entry_type, content, created_at)
           VALUES ($1::text, $2, $3, NOW())`,
          [questId, isCompleting ? 'quest_completed' : 'quest_failed', journalContent]
        );

        // Salvar na memória do objetivo (objective_memories)
        try {
          const memoryContent = `
**Quest ${isCompleting ? 'Completada' : 'Falhada'}: ${quest?.title || 'Quest'}**

${isCompleting ? '✅' : '❌'} Status: ${isCompleting ? 'Completada' : 'Falhada'}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

${feeling ? `💭 **Como você está se sentindo:**\n${feeling}\n` : ''}
${reflection ? `📝 **Reflexão:**\n${reflection}\n` : ''}

---

*Salvo automaticamente ao ${isCompleting ? 'completar' : 'falhar'} a quest*
          `.trim();

          await pool.query(
            `INSERT INTO objective_memories (objective_id, session_id, memory, created_at)
             VALUES ($1::text, $2::text, $3, NOW())`,
            [existing.rows[0].parent_goal_id, userId, memoryContent]
          );
        } catch (e) {
          console.warn('[Quest] objective_memories update skipped:', e.message);
        }
      } catch (e) {
        console.warn('[Quest] Memory update skipped:', e.message);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Quest update error:', error);
    return NextResponse.json({ error: 'Failed to update quest' }, { status: 500 });
  }
}

// DELETE quest
export async function DELETE(request, context) {
  try {
    const { id: questId } = await context.params;
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const result = await pool.query(
      `DELETE FROM quests WHERE id::text = $1::text AND ${COLS.questsUser} = $2::text RETURNING id`,
      [questId, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Quest not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quest deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete quest' }, { status: 500 });
  }
}
