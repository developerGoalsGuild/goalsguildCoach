import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';

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
    const sessionId = decoded.sessionId;

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

    // Buscar progresso atual do usuário
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN id END) as total_quests,
        COALESCE(SUM(current_xp), 0) as total_xp,
        COUNT(DISTINCT parent_goal_id) as total_objectives
      FROM quests
      WHERE session_id = $1
    `, [sessionId]);

    const stats = statsResult.rows[0] || { total_quests: 0, total_xp: 0, total_objectives: 0 };

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
      objectives: achievementsWithProgress.filter(a => a.category === 'objectives')
    };

    return NextResponse.json({
      achievements: achievementsWithProgress,
      grouped,
      stats: {
        unlocked: unlockedResult.rows.length,
        total: allAchievements.rows.length,
        percentage: Math.round((unlockedResult.rows.length / allAchievements.rows.length) * 100)
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
    const sessionId = decoded.sessionId;
    const newlyUnlocked = [];

    // Buscar stats atuais do usuário
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' THEN id END) as total_quests,
        COALESCE(SUM(current_xp), 0) as total_xp,
        COUNT(DISTINCT parent_goal_id) as total_objectives
      FROM quests
      WHERE session_id = $1
    `, [sessionId]);

    const stats = statsResult.rows[0] || { total_quests: 0, total_xp: 0, total_objectives: 0 };

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
            name: achievement.name
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
