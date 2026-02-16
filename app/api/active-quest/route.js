import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getAuthToken, verifyJWT } from '../../lib/auth';
import { COLS } from '../../lib/db-schema';

// GET active quest (schema-working: status 'in_progress', sem start_date)
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
      `SELECT q.*, g.title as goal_title FROM quests q LEFT JOIN goals g ON q.parent_goal_id::text = g.id::text WHERE q.${COLS.questsUser} = $1::text AND q.status = $2 ORDER BY q.created_at DESC LIMIT 1`,
      [userId, 'in_progress']
    );

    return NextResponse.json({ active_quest: result.rows[0] || null });

  } catch (error) {
    console.error('Active quest error:', error);
    return NextResponse.json({ error: 'Failed to fetch active quest' }, { status: 500 });
  }
}

// POST set active quest
export async function POST(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    const userId = decoded.userId;

    const { quest_id } = await request.json();

    await pool.query(
      `UPDATE quests SET status = $1 WHERE ${COLS.questsUser} = $2::text`,
      ['planning', userId]
    );

    const result = await pool.query(
      `UPDATE quests SET status = $1 WHERE id::text = $2::text AND ${COLS.questsUser} = $3::text RETURNING *`,
      ['in_progress', quest_id, userId]
    );

    return NextResponse.json({
      active_quest: result.rows[0] || null,
      active_quest_id: quest_id,
    });

  } catch (error) {
    console.error('Set active quest error:', error);
    return NextResponse.json({ error: 'Failed to set active quest' }, { status: 500 });
  }
}
