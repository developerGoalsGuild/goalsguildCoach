import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { addXP, XP_PER_CHECKIN, XP_PER_CHECKIN_STREAK_BONUS } from '../../lib/level';

// GET - Buscar resumo do dia atual
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
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Buscar quests completadas hoje
    const questsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) = $2 THEN id END) as quests_completed,
        COUNT(CASE WHEN status = 'completed' AND DATE(completed_at) = $2 THEN 1 END) as milestones_completed,
        COALESCE(SUM(CASE WHEN DATE(completed_at) = $2 THEN current_xp END), 0) as total_xp
      FROM quests
      WHERE session_id = $1
    `, [sessionId, today]);

    // Buscar objetivos ativos
    const objectivesResult = await pool.query(`
      SELECT COUNT(*) as active_objectives
      FROM nlp_objectives
      WHERE session_id = $1 AND status = 'active'
    `, [sessionId]);

    // Buscar mensagens trocadas hoje
    const messagesResult = await pool.query(`
      SELECT COUNT(*) as messages_count
      FROM messages
      WHERE session_id = $1
        AND DATE(created_at) = $2
    `, [sessionId, today]);

    return NextResponse.json({
      date: today,
      summary: {
        quests_completed: questsResult.rows[0].quests_completed || 0,
        milestones_completed: questsResult.rows[0].milestones_completed || 0,
        total_xp: questsResult.rows[0].total_xp || 0,
        active_objectives: objectivesResult.rows[0].active_objectives || 0,
        messages_count: messagesResult.rows[0].messages_count || 0
      }
    });

  } catch (error) {
    console.error('Error fetching daily summary:', error);
    return NextResponse.json({ error: 'Failed to fetch daily summary' }, { status: 500 });
  }
}

// POST - Salvar nota/reflexão do dia
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
    const { mood, gratitude, highlights, challenges, tomorrow_goals } = await request.json();
    
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    const pool = getPool();
    const sessionId = decoded.sessionId || decoded.userId;
    const today = new Date().toISOString().split('T')[0];

    // Salvar no journal (reusando tabela quest_journal)
    // Buscar uma quest recente para associar
    const questResult = await pool.query(
      'SELECT id FROM quests WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1',
      [sessionId]
    );

    const questId = questResult.rows.length > 0 ? questResult.rows[0].id : null;

    // Check if first check-in today (only award XP once per day)
    const existingCheckin = await pool.query(
      `SELECT 1 FROM quest_journal qj
       JOIN quests q ON qj.quest_id::text = q.id::text
       WHERE q.session_id = $1 AND qj.entry_type = 'daily_checkin' AND DATE(qj.created_at) = $2
       LIMIT 1`,
      [sessionId, today]
    );
    const isFirstCheckinToday = existingCheckin.rows.length === 0;

    await pool.query(`
      INSERT INTO quest_journal (
        quest_id, entry_type, content, mood, created_at
      ) VALUES ($1, $2, $3, $4, $5)
    `, [
      questId,
      'daily_checkin',
      JSON.stringify({ gratitude, highlights, challenges, tomorrow_goals }),
      mood,
      today
    ]);

    let xpEarned = 0;
    if (isFirstCheckinToday) {
      let checkinStreak = 0;
      try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().slice(0, 10);
        const daysResult = await pool.query(
          `SELECT DISTINCT DATE(qj.created_at) as d FROM quest_journal qj
           JOIN quests q ON qj.quest_id::text = q.id::text
           WHERE q.session_id = $1 AND qj.entry_type = 'daily_checkin' AND DATE(qj.created_at) <= $2
           ORDER BY d DESC LIMIT 31`,
          [sessionId, yesterdayStr]
        );
        const dates = (daysResult.rows || []).map((r) => r.d);
        for (let i = 0; i < dates.length; i++) {
          const expect = new Date(yesterday);
          expect.setDate(expect.getDate() - i);
          if (dates[i] !== expect.toISOString().slice(0, 10)) break;
          checkinStreak++;
        }
        const streakBonus = Math.max(0, checkinStreak * XP_PER_CHECKIN_STREAK_BONUS);
        const totalXP = XP_PER_CHECKIN + streakBonus;
        await addXP(pool, sessionId, totalXP);
        xpEarned = totalXP;
      } catch (e) {
        console.warn('[Daily] addXP skipped:', e.message);
        try {
          await addXP(pool, sessionId, XP_PER_CHECKIN);
          xpEarned = XP_PER_CHECKIN;
        } catch (_) {}
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reflexao do dia salva!',
      xp_earned: xpEarned
    });

  } catch (error) {
    console.error('Error saving daily reflection:', error);
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 });
  }
}
