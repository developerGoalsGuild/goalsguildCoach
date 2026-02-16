import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';
import { TABLES, COLS } from '../../lib/db-schema';

// GET - Analytics (quests, milestones, tasks). No cache so data is always fresh.
export async function GET(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = user.userId;
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Resolve milestone table name (quest_milestones or milestones)
    let milestonesTable = TABLES.milestones;
    try {
      const msTableResult = await pool.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('quest_milestones', 'milestones')`
      );
      milestonesTable = msTableResult.rows.some((r) => r.table_name === 'quest_milestones')
        ? 'quest_milestones'
        : 'milestones';
    } catch (_) {}

    // Detect XP column (xp_reward, estimated_xp, or current_xp)
    let xpColumn = null;
    try {
      const xpColResult = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quests' AND column_name IN ('xp_reward', 'estimated_xp', 'current_xp')`
      );
      if (xpColResult.rows.length > 0) {
        xpColumn = xpColResult.rows[0].column_name;
      }
    } catch (_) {}

    // Use detected XP column or default to 0 if none exists
    const xpColExpr = xpColumn ? `COALESCE(${xpColumn}, 0)` : '0';

    // 1. General stats (all time) and total XP
    const generalStats = await pool.query(
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN id END) as total_quests_completed,
        COUNT(CASE WHEN status IN ('active', 'in_progress') THEN id END) as active_quests,
        COALESCE(SUM(${xpColExpr}), 0) as total_xp_offered,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN ${xpColExpr} END), 0) as total_xp_earned
       FROM quests WHERE ${COLS.questsUser} = $1`,
      [sessionId]
    );
    const totalXP = Number(generalStats.rows[0]?.total_xp_earned || 0);

    // 2. Week stats: quests completed, milestones completed (from quest_milestones), xp, active days
    const weekQuests = await pool.query(
      `SELECT COUNT(*)::int as n, COALESCE(SUM(${xpColExpr}), 0)::int as xp FROM quests WHERE ${COLS.questsUser} = $1 AND status = 'completed' AND completed_at >= $2`,
      [sessionId, weekAgo]
    );
    const weekMilestones = await pool.query(
      `SELECT COUNT(*)::int as n FROM ${milestonesTable} m WHERE m.quest_id IN (SELECT id FROM quests WHERE ${COLS.questsUser} = $1) AND m.status = 'completed' AND m.completed_at IS NOT NULL AND m.completed_at >= $2`,
      [sessionId, weekAgo]
    );
    const weekActiveDays = await pool.query(
      `SELECT COUNT(DISTINCT d)::int as n FROM (
        SELECT DATE(completed_at) as d FROM quests WHERE ${COLS.questsUser} = $1 AND completed_at >= $2 AND status = 'completed'
        UNION
        SELECT DATE(m.completed_at) FROM ${milestonesTable} m WHERE m.quest_id IN (SELECT id FROM quests WHERE ${COLS.questsUser} = $1) AND m.completed_at IS NOT NULL AND m.completed_at >= $2 AND m.status = 'completed'
        UNION
        SELECT DATE(completed_at) FROM ${TABLES.tasks} WHERE ${COLS.questsUser} = $1 AND completed_at >= $2 AND status = 'completed'
      ) x`,
      [sessionId, weekAgo]
    );
    const weekStats = {
      quests_completed: Number(weekQuests.rows[0]?.n || 0),
      milestones_completed: Number(weekMilestones.rows[0]?.n || 0),
      xp_earned: Number(weekQuests.rows[0]?.xp || 0),
      active_days: Number(weekActiveDays.rows[0]?.n || 0),
    };

    // 3. Month stats
    const monthQuests = await pool.query(
      `SELECT COUNT(*)::int as n, COALESCE(SUM(${xpColExpr}), 0)::int as xp FROM quests WHERE ${COLS.questsUser} = $1 AND status = 'completed' AND completed_at >= $2`,
      [sessionId, monthAgo]
    );
    const monthMilestones = await pool.query(
      `SELECT COUNT(*)::int as n FROM ${milestonesTable} m WHERE m.quest_id IN (SELECT id FROM quests WHERE ${COLS.questsUser} = $1) AND m.status = 'completed' AND m.completed_at IS NOT NULL AND m.completed_at >= $2`,
      [sessionId, monthAgo]
    );
    const monthActiveDays = await pool.query(
      `SELECT COUNT(DISTINCT d)::int as n FROM (
        SELECT DATE(completed_at) as d FROM quests WHERE ${COLS.questsUser} = $1 AND completed_at >= $2 AND status = 'completed'
        UNION
        SELECT DATE(m.completed_at) FROM ${milestonesTable} m WHERE m.quest_id IN (SELECT id FROM quests WHERE ${COLS.questsUser} = $1) AND m.completed_at IS NOT NULL AND m.completed_at >= $2 AND m.status = 'completed'
        UNION
        SELECT DATE(completed_at) FROM ${TABLES.tasks} WHERE ${COLS.questsUser} = $1 AND completed_at >= $2 AND status = 'completed'
      ) x`,
      [sessionId, monthAgo]
    );
    const monthStats = {
      quests_completed: Number(monthQuests.rows[0]?.n || 0),
      milestones_completed: Number(monthMilestones.rows[0]?.n || 0),
      xp_earned: Number(monthQuests.rows[0]?.xp || 0),
      active_days: Number(monthActiveDays.rows[0]?.n || 0),
    };

    // 4. Productivity by day of week (last month) - from milestones
    const dailyProductivity = await pool.query(
      `SELECT 
        EXTRACT(DOW FROM m.completed_at)::int as day_of_week,
        COUNT(*)::int as milestones_count,
        0 as xp_earned
       FROM ${milestonesTable} m
       WHERE m.quest_id IN (SELECT id FROM quests WHERE ${COLS.questsUser} = $1) AND m.completed_at IS NOT NULL AND m.completed_at >= $2 AND m.status = 'completed'
       GROUP BY EXTRACT(DOW FROM m.completed_at)
       ORDER BY day_of_week`,
      [sessionId, monthAgo]
    );

    // 5. Objectives progress (goals table)
    const objectivesProgress = await pool.query(
      `SELECT 
        o.id,
        o.title,
        o.statement,
        o.created_at,
        o.status,
        o.is_nlp_complete,
        COUNT(DISTINCT q.id) as quests_created,
        COUNT(DISTINCT CASE WHEN q.status = 'completed' THEN q.id END) as quests_completed,
        COALESCE(SUM(COALESCE(q.xp_reward, 0)), 0) as total_xp_earned,
        COALESCE(SUM(COALESCE(q.xp_reward, 0)), 0) as total_xp
       FROM goals o
       LEFT JOIN quests q ON q.parent_goal_id::text = o.id::text
       WHERE o.${COLS.goalsUser} = $1
       GROUP BY o.id, o.title, o.statement, o.created_at, o.status, o.is_nlp_complete
       ORDER BY o.created_at DESC`,
      [sessionId]
    );

    // 6. Tasks trend (last 30 days) - from tasks table
    const tasksTrend = await pool.query(
      `SELECT DATE(completed_at) as date, COUNT(*)::int as completed
       FROM ${TABLES.tasks}
       WHERE ${COLS.questsUser} = $1 AND completed_at >= $2 AND status = 'completed'
       GROUP BY DATE(completed_at)
       ORDER BY date DESC
       LIMIT 30`,
      [sessionId, monthAgo]
    );

    // 7. Level from total XP
    const level = Math.max(1, Math.floor(totalXP / 1000) + 1);
    const currentLevelXP = totalXP % 1000;
    const xpToNextLevel = Math.max(100, 1000 - currentLevelXP);

    // 8. Streak (from streaks table or derive from activity)
    let streakLongest = 0;
    try {
      const streakRes = await pool.query(
        `SELECT COALESCE(MAX(quests_completed), 0)::int as s FROM streaks WHERE session_id = $1`,
        [sessionId]
      );
      streakLongest = Number(streakRes.rows[0]?.s || 0);
    } catch (_) {}

    const headers = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    };

    return NextResponse.json(
      {
        level: { level, current_xp: currentLevelXP, xp_to_next_level: xpToNextLevel },
        general: generalStats.rows[0] || {},
        week: weekStats,
        month: monthStats,
        productivityByDay: dailyProductivity.rows,
        objectives: objectivesProgress.rows,
        tasksTrend: tasksTrend.rows,
        streak: { longest_streak: streakLongest },
      },
      { headers }
    );
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
