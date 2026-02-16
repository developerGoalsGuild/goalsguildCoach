import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { ensureLevelSchema, getLevelFromTotalXP } from '../../lib/level';

// GET - Buscar achievements do usuário
export async function GET(request) {
  const { getAuthToken } = require('../../lib/auth');
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verifyJWT } = require('../../lib/auth');
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = decoded.sessionId || decoded.userId;
    await ensureLevelSchema(pool);

    // Buscar todos achievements disponíveis
    const allAchievements = await pool.query(`
      SELECT id, name, description, category, requirement_value, icon
      FROM achievements
      ORDER BY category, requirement_value
    `);

    // Buscar achievements desbloqueados pelo usuário
    const unlockedResult = await pool.query(`
      SELECT 
        ua.achievement_id,
        ua.unlocked_at,
        a.name,
        a.description,
        a.category,
        a.icon
      FROM user_achievements ua
      INNER JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.session_id = $1
      ORDER BY ua.unlocked_at DESC
    `, [sessionId]);

    // Buscar progresso: quests e objetivos da tabela quests; XP de sessions.total_xp
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN id END) as total_quests,
        COUNT(DISTINCT parent_goal_id) as total_objectives
      FROM quests
      WHERE session_id = $1
    `, [sessionId]);
    const totalXpResult = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
    const total_xp = Number(totalXpResult.rows[0]?.total_xp ?? 0);
    const stats = { ...(statsResult.rows[0] || { total_quests: 0, total_objectives: 0 }), total_xp };

    // Calcular streak
    const streakResult = await pool.query(`
      WITH dates AS (
        SELECT DISTINCT DATE(completed_at) as date
        FROM quests
        WHERE session_id = $1
          AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
      )
      SELECT COUNT(*) as streak
      FROM dates
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `, [sessionId]);

    const longestStreak = streakResult.rows[0]?.streak || 0;
    const currentLevel = getLevelFromTotalXP(total_xp).level;

    // Calcular progresso para cada achievement
    const achievementsWithProgress = allAchievements.rows.map(achievement => {
      let progress = 0;
      let unlocked = false;
      let unlockedAt = null;

      // Verificar se já desbloqueado
      const unlockedData = unlockedResult.rows.find(u => u.achievement_id === achievement.id);
      if (unlockedData) {
        unlocked = true;
        unlockedAt = unlockedData.unlocked_at;
      }

      // Calcular progresso
      switch (achievement.category) {
        case 'quests':
          progress = Math.min(stats.total_quests, achievement.requirement_value);
          break;
        case 'xp':
          progress = Math.min(stats.total_xp, achievement.requirement_value);
          break;
        case 'streak':
          progress = Math.min(longestStreak, achievement.requirement_value);
          break;
        case 'objectives':
          progress = Math.min(stats.total_objectives, achievement.requirement_value);
          break;
        case 'level':
          progress = Math.min(currentLevel, achievement.requirement_value);
          break;
      }

      return {
        ...achievement,
        progress,
        maxProgress: achievement.requirement_value,
        unlocked,
        unlockedAt
      };
    });

    // Agrupar por categoria
    const grouped = {
      quests: achievementsWithProgress.filter(a => a.category === 'quests'),
      xp: achievementsWithProgress.filter(a => a.category === 'xp'),
      streak: achievementsWithProgress.filter(a => a.category === 'streak'),
      objectives: achievementsWithProgress.filter(a => a.category === 'objectives'),
      level: achievementsWithProgress.filter(a => a.category === 'level')
    };

    const unlockedCount = achievementsWithProgress.filter(a => a.unlocked).length;
    return NextResponse.json({
      achievements: achievementsWithProgress,
      grouped,
      stats: {
        unlocked: unlockedCount,
        total: allAchievements.rows.length,
        percentage: allAchievements.rows.length
          ? Math.round((unlockedCount / allAchievements.rows.length) * 100)
          : 0
      }
    });

  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST - Verificar e desbloquear achievements automaticamente
export async function POST(request) {
  const { getAuthToken } = require('../../lib/auth');
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verifyJWT } = require('../../lib/auth');
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = decoded.sessionId || decoded.userId;
    await ensureLevelSchema(pool);
    const newlyUnlocked = [];

    // Buscar stats atuais do usuário (quests/objetivos de quests; XP de sessions)
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN id END) as total_quests,
        COUNT(DISTINCT parent_goal_id) as total_objectives
      FROM quests
      WHERE session_id = $1
    `, [sessionId]);
    const xpResult = await pool.query(
      `SELECT COALESCE(total_xp, 0)::int as total_xp FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
    const total_xp = Number(xpResult.rows[0]?.total_xp ?? 0);
    const stats = { ...(statsResult.rows[0] || { total_quests: 0, total_objectives: 0 }), total_xp };

    // Calcular streak
    const streakResult = await pool.query(`
      WITH dates AS (
        SELECT DISTINCT DATE(completed_at) as date
        FROM quests
        WHERE session_id = $1
          AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY date DESC
      )
      SELECT COUNT(*) as streak
      FROM dates
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    `, [sessionId]);

    const longestStreak = streakResult.rows[0]?.streak || 0;
    const currentLevel = getLevelFromTotalXP(total_xp).level;

    // Buscar todos achievements
    const achievementsResult = await pool.query(`
      SELECT id, name, category, requirement_value
      FROM achievements
      ORDER BY requirement_value
    `);

    // Verificar cada achievement
    for (const achievement of achievementsResult.rows) {
      let meetsRequirement = false;

      switch (achievement.category) {
        case 'quests':
          meetsRequirement = stats.total_quests >= achievement.requirement_value;
          break;
        case 'xp':
          meetsRequirement = stats.total_xp >= achievement.requirement_value;
          break;
        case 'streak':
          meetsRequirement = longestStreak >= achievement.requirement_value;
          break;
        case 'objectives':
          meetsRequirement = stats.total_objectives >= achievement.requirement_value;
          break;
        case 'level':
          meetsRequirement = currentLevel >= achievement.requirement_value;
          break;
      }

      if (meetsRequirement) {
        // Verificar se já desbloqueado
        const unlockedResult = await pool.query(
          'SELECT id FROM user_achievements WHERE session_id = $1 AND achievement_id = $2',
          [sessionId, achievement.id]
        );

        if (unlockedResult.rows.length === 0) {
          // Desbloquear achievement
          await pool.query(
            'INSERT INTO user_achievements (session_id, achievement_id, unlocked_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
            [sessionId, achievement.id]
          );

          newlyUnlocked.push({
            id: achievement.id,
            name: achievement.name,
            category: achievement.category,
            requirement_value: achievement.requirement_value
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      newlyUnlocked,
      message: newlyUnlocked.length > 0 
        ? newlyUnlocked.length + ' nova(s) conquista(s) desbloqueada(s)!' 
        : 'Nenhum achievement novo desbloqueado.'
    });

  } catch (error) {
    console.error('Error checking achievements:', error);
    return NextResponse.json({ error: 'Failed to check achievements' }, { status: 500 });
  }
}
