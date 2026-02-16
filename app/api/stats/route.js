import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getAuthToken, verifyJWT } from '../../lib/auth';
import { TABLES, COLS } from '../../lib/db-schema';
import { getLevelFromTotalXP, ensureLevelSchema } from '../../lib/level';

export async function GET(request) {
  try {
    const token = getAuthToken(request);
    const decoded = token ? verifyJWT(token) : null;

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pool = getPool();
    await ensureLevelSchema(pool);
    const userId = decoded.userId;

    const streakResult = await pool.query(
      `SELECT * FROM streaks WHERE ${COLS.questsUser} = $1::text`,
      [userId]
    );

    const tasksResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = $1) as completed, COUNT(*) as total FROM ${TABLES.tasks} WHERE ${COLS.questsUser} = $2::text`,
      ['completed', userId]
    );

    const questsResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = $1) as completed, COUNT(*) as total FROM quests WHERE ${COLS.questsUser} = $2::text`,
      ['completed', userId]
    );

    const goalsResult = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE status = $1) as completed, COUNT(*) as total FROM goals WHERE ${COLS.goalsUser} = $2::text`,
      ['completed', userId]
    );

    const sessionsXP = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [userId]
    );
    const totalXP = Number(sessionsXP.rows[0]?.total_xp ?? 0);
    const level = getLevelFromTotalXP(totalXP);

    return NextResponse.json({
      level,
      total_xp: totalXP,
      stats: {
        streak: streakResult.rows[0]?.current_streak || 0,
        longest_streak: streakResult.rows[0]?.longest_streak || 0,
        tasks: {
          completed: parseInt(tasksResult.rows[0]?.completed) || 0,
          total: parseInt(tasksResult.rows[0]?.total) || 0,
        },
        quests: {
          completed: parseInt(questsResult.rows[0]?.completed) || 0,
          total: parseInt(questsResult.rows[0]?.total) || 0,
        },
        goals: {
          completed: parseInt(goalsResult.rows[0]?.completed) || 0,
          total: parseInt(goalsResult.rows[0]?.total) || 0,
        },
      },
    });

  } catch (error) {
    console.error('Stats fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
