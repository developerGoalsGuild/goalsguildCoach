import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';

// GET - Gerar report semanal/mensal (tabela unificada goals)
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // week, month
    const format = searchParams.get('format') || 'text'; // text, json

    const pool = getPool();
    const today = new Date();
    const sessionId = user.userId;
    const startDate = period === 'week' 
      ? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Buscar dados do período
    const statsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN status = 'completed' AND completed_at >= $2 THEN id END) as quests_completed,
        COUNT(CASE WHEN status = 'completed' AND completed_at >= $2 THEN 1 END) as milestones_completed,
        COALESCE(SUM(CASE WHEN completed_at >= $2 THEN current_xp END), 0) as xp_earned,
        COUNT(DISTINCT CASE WHEN completed_at >= $2 THEN DATE(completed_at) END) as active_days
      FROM quests
      WHERE session_id = $1
    `, [sessionId, startDate]);

    const objectivesResult = await pool.query(`
      SELECT 
        COALESCE(o.title, o.statement) as statement,
        COUNT(DISTINCT q.id) as quests_created,
        COUNT(DISTINCT CASE WHEN q.status = 'completed' AND q.completed_at >= $2 THEN q.id END) as quests_completed,
        COALESCE(SUM(CASE WHEN q.completed_at >= $2 THEN q.current_xp END), 0) as xp_earned
      FROM goals o
      LEFT JOIN quests q ON q.parent_goal_id::text = o.id::text
      WHERE o.session_id = $1
      GROUP BY o.id, o.title, o.statement
      ORDER BY xp_earned DESC
    `, [sessionId, startDate]);

    const tasksResult = await pool.query(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending
      FROM quests
      WHERE session_id = $1
        AND completed_at >= $2
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `, [sessionId, startDate]);

    const dailyReflections = await pool.query(`
      SELECT 
        DATE(qj.created_at) as date,
        qj.mood,
        qj.content
      FROM quest_journal qj
      INNER JOIN quests q ON qj.quest_id = q.id::text
      WHERE q.session_id = $1
        AND qj.entry_type = 'daily_checkin'
        AND qj.created_at >= $2
      ORDER BY date DESC
    `, [sessionId, startDate]);

    // Gerar report
    const stats = statsResult.rows[0] || {};
    const report = {
      period: period,
      startDate: startDate.toISOString(),
      endDate: today.toISOString(),
      generatedAt: today.toISOString(),
      summary: {
        questsCompleted: stats.quests_completed || 0,
        milestonesCompleted: stats.milestones_completed || 0,
        xpEarned: stats.xp_earned || 0,
        activeDays: stats.active_days || 0,
        averageXPPerDay: stats.active_days > 0 ? Math.round((stats.xp_earned || 0) / stats.active_days) : 0,
        averageMilestonesPerDay: stats.active_days > 0 ? Math.round((stats.milestones_completed || 0) / stats.active_days) : 0
      },
      objectives: objectivesResult.rows,
      dailyTasks: tasksResult.rows,
      reflections: dailyReflections.rows
    };

    if (format === 'json') {
      return NextResponse.json(report);
    }

    // Formatar como texto
    const textReport = generateTextReport(report, period);
    
    return NextResponse.json({ report: textReport });

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}

function generateTextReport(report, period) {
  const periodName = period === 'week' ? 'Semana' : 'Mes';
  const startDate = new Date(report.startDate).toLocaleDateString('pt-BR');
  const endDate = new Date(report.endDate).toLocaleDateString('pt-BR');

  let text = `
=========================================
   GOALSGUILD - RELATORIO ${periodName}
           ${startDate} - ${endDate}
=========================================

RESUMO GERAL
--------------------------------------------------

  Quests Completadas:     ${report.summary.questsCompleted}
  Milestones Completados: ${report.summary.milestonesCompleted}
  XP Total Ganho:         ${report.summary.xpEarned}
  Dias Ativos:            ${report.summary.activeDays}
  Media XP/Dia:           ${report.summary.averageXPPerDay}
  Media Milestones/Dia:   ${report.summary.averageMilestonesPerDay}

`;

  if (report.objectives.length > 0) {
    text += `
PROGRESSO POR OBJETIVO
--------------------------------------------------

`;
    report.objectives.forEach((obj, index) => {
      text += `
${index + 1}. ${obj.statement.substring(0, 60)}...
   • Quests criadas: ${obj.quests_created}
   • Quests completadas: ${obj.quests_completed}
   • XP ganho: ${obj.xp_earned}
`;
    });
  }

  if (report.dailyTasks.length > 0) {
    text += `

TAREFAS POR DIA
--------------------------------------------------

`;
    report.dailyTasks.slice(0, 10).forEach(day => {
      const date = new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      text += `  ${date}: OK ${day.completed} | PENDENTE ${day.pending}\n`;
    });
  }

  if (report.reflections.length > 0) {
    text += `

REFLEXOES DIARIAS
--------------------------------------------------

`;
    report.reflections.slice(0, 5).forEach(reflection => {
      const date = new Date(reflection.date).toLocaleDateString('pt-BR');
      const mood = reflection.mood || 'N/A';
      const content = typeof reflection.content === 'string' ? JSON.parse(reflection.content) : reflection.content;      
      text += `
${date} | Mood: ${mood}
`;
      if (content.highlights) {
        text += `   ${content.highlights.substring(0, 80)}...\n`;
      }
    });
  }

  text += `

==================================================
Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}
==================================================
`;

  return text;
}
