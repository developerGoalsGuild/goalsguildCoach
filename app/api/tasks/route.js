import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getAuthToken, verifyJWT } from '../../lib/auth';
import { TABLES, COLS } from '../../lib/db-schema';
import { checkSubscriptionLimit, getQuestTaskCount } from '../../lib/subscription.js';

export async function GET(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const result = await pool.query(
      `SELECT t.*, q.title as quest_title FROM ${TABLES.tasks} t LEFT JOIN quests q ON t.quest_id::text = q.id::text WHERE t.${COLS.questsUser} = $1::text ORDER BY t.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ tasks: result.rows });

  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const { title, description, quest_id, estimated_hours } = await request.json();

    if (quest_id) {
      const taskCount = await getQuestTaskCount(userId, quest_id);
      const tasksLimit = await checkSubscriptionLimit(userId, 'tasks', taskCount);
      if (!tasksLimit.allowed) {
        return NextResponse.json(
          { error: tasksLimit.message || 'You have reached the maximum tasks per quest for your plan. Upgrade for more.' },
          { status: 403 }
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO ${TABLES.tasks} (${COLS.questsUser}, title, description, quest_id, estimated_hours) VALUES ($1::text, $2, $3, $4::text, $5) RETURNING *`,
      [userId, title, description || '', quest_id || null, estimated_hours || null]
    );

    return NextResponse.json({ task: result.rows[0] });

  } catch (error) {
    console.error('Task creation error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
