import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { verifyJWT, getAuthToken } from '../../lib/auth';
import { TABLES, COLS } from '../../lib/db-schema';

// GET all quests (authenticated)
export async function GET(request) {
  try {
    const pool = getPool();
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const result = await pool.query(
      `SELECT 
        q.*,
        COALESCE(
          (
            SELECT COUNT(*)::float 
            FROM ${TABLES.milestones} 
            WHERE quest_id::text = q.id::text AND status = 'completed'
          ) / 
          NULLIF(
            (SELECT COUNT(*) 
            FROM ${TABLES.milestones} 
            WHERE quest_id::text = q.id::text), 
          0) * 100, 
        0) as completion_percentage
      FROM quests q 
      WHERE q.${COLS.questsUser} = $1::text 
      ORDER BY q.created_at DESC`,
      [userId]
    );

    return NextResponse.json({ quests: result.rows });
  } catch (error) {
    console.error('Quests fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 });
  }
}

// POST new quest (authenticated)
export async function POST(request) {
  try {
    const pool = getPool();
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, description, difficulty, xp_reward, target_date } = await request.json();

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    const targetDateStr = target_date && /^\d{4}-\d{2}-\d{2}$/.test(String(target_date).trim()) ? String(target_date).trim() : null;
    if (!targetDateStr) {
      return NextResponse.json({ error: 'Target date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    // Map difficulty: API accepts numeric (1-5) or string ('easy','medium','hard','epic')
    const DIFFICULTY_MAP = { 1: 'easy', 2: 'easy', 3: 'medium', 4: 'hard', 5: 'epic' };
    const validStrings = ['easy', 'medium', 'hard', 'epic'];
    let difficultyVal = difficulty ?? 'medium';
    if (typeof difficultyVal === 'number' && difficultyVal >= 1 && difficultyVal <= 5) {
      difficultyVal = DIFFICULTY_MAP[difficultyVal] || 'medium';
    } else if (typeof difficultyVal === 'string' && !validStrings.includes(difficultyVal)) {
      difficultyVal = 'medium';
    }

    // Every quest must have a target_date; include estimated_xp (or xp_reward) if column exists
    const questCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('target_date', 'estimated_xp', 'xp_reward')`
    );
    let hasTargetDate = questCols.rows.some((r) => r.column_name === 'target_date');
    const xpCol = questCols.rows.some((r) => r.column_name === 'estimated_xp') ? 'estimated_xp' : questCols.rows.some((r) => r.column_name === 'xp_reward') ? 'xp_reward' : null;

    if (!hasTargetDate) {
      try {
        await pool.query('ALTER TABLE quests ADD COLUMN IF NOT EXISTS target_date DATE');
        hasTargetDate = true;
      } catch (alterErr) {
        console.error('Could not add target_date column:', alterErr);
        return NextResponse.json(
          { error: 'Every quest must have a target date. The quests table is missing the target_date column. Add it with: ALTER TABLE quests ADD COLUMN target_date DATE;' },
          { status: 400 }
        );
      }
    }

    const insertCols = [COLS.questsUser, 'title', 'description', 'difficulty'];
    const insertVals = [decoded.userId, title.trim(), description || '', difficultyVal];
    if (xpCol) {
      insertCols.push(xpCol);
      insertVals.push(xp_reward ?? 100);
    }
    insertCols.push('target_date');
    insertVals.push(targetDateStr);

    const placeholders = insertCols.map((_, i) => (i === 0 ? '$1::text' : `$${i + 1}`)).join(', ');
    const result = await pool.query(
      `INSERT INTO quests (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`,
      insertVals
    );

    const quest = result.rows[0];
    quest.completion_percentage = 0; // Nova quest começa com 0%

    return NextResponse.json({ quest });
  } catch (error) {
    console.error('Quest creation error:', error);
    return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 });
  }
}
