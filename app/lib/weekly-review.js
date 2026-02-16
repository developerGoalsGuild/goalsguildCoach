import { getPool } from './db.js';

// Gerar weekly review
export async function generateWeeklyReview(sessionId) {
  const pool = getPool();
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  weekStart.setHours(0, 0, 0, 0);

  // Estatísticas da semana
  const weekStats = await pool.query(`
    SELECT 
      COUNT(DISTINCT id) FILTER (WHERE status = 'completed' AND completed_at >= $2) as quests_completed,
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= $2) as milestones_completed,
      COALESCE(SUM(xp_earned) FILTER (WHERE completed_at >= $2), 0) as xp_earned,
      COUNT(DISTINCT DATE(completed_at)) FILTER (WHERE completed_at >= $2) as active_days,
      COALESCE(MAX(streak) FILTER (WHERE activity_date >= $2), 0) as longest_streak
    FROM quests
    WHERE session_id = $1
  `, [sessionId, weekStart]);

  // Estatísticas da semana anterior (para comparação)
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(weekStart.getDate() - 7);

  const lastWeekStats = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'completed' AND completed_at >= $2 AND completed_at < $3) as milestones_completed,
      COALESCE(SUM(xp_earned) FILTER (WHERE completed_at >= $2 AND completed_at < $3), 0) as xp_earned
    FROM quests
    WHERE session_id = $1
  `, [sessionId, lastWeekStart, weekStart]);

  // Objetivos progresso
  const objectivesResult = await pool.query(`
    SELECT 
      o.statement,
      COUNT(DISTINCT q.id) as quests_created,
      COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'completed' AND q.completed_at >= $2) as quests_completed
    FROM nlp_objectives o
    LEFT JOIN quests q ON q.objective_id = o.id
    WHERE o.session_id = $1
    GROUP BY o.statement
    ORDER BY quests_completed DESC
  `, [sessionId, weekStart]);

  // Check-ins da semana
  const checkinsResult = await pool.query(`
    SELECT 
      DATE(qj.created_at) as date,
      qj.mood,
      qj.content
    FROM quest_journal qj
    INNER JOIN nlp_objectives o ON o.id = qj.quest_id
    WHERE o.session_id = $1
      AND qj.entry_type = 'daily_checkin'
      AND qj.created_at >= $2
    ORDER BY date DESC
  `, [sessionId, weekStart]);

  // Gerar perguntas reflexivas
  const questions = generateWeeklyQuestions(weekStats.rows[0], lastWeekStats.rows[0]);

  // Gerar texto do review
  const reviewText = generateWeeklyReviewText(
    weekStats.rows[0],
    lastWeekStats.rows[0],
    objectivesResult.rows,
    checkinsResult.rows,
    questions
  );

  return {
    period: {
      start: weekStart.toISOString(),
      end: now.toISOString()
    },
    stats: {
      current: weekStats.rows[0],
      previous: lastWeekStats.rows[0]
    },
    objectives: objectivesResult.rows,
    checkins: checkinsResult.rows,
    questions,
    reviewText,
    generatedAt: now.toISOString()
  };
}

function generateWeeklyQuestions(currentWeek, previousWeek) {
  const questions = [];

  questions.push({
    id: 'learned',
    text: 'O que você aprendeu esta semana?',
    type: 'reflection',
    priority: 'high'
  });

  questions.push({
    id: 'victory',
    text: 'Qual foi sua maior vitória esta semana?',
    type: 'celebration',
    priority: 'high'
  });

  // Comparação com semana anterior
  if (currentWeek && previousWeek) {
    const xpGrowth = currentWeek.xp_earned - previousWeek.xp_earned;
    if (xpGrowth > 0) {
      questions.push({
        id: 'improvement',
        text: `Você ganhou ${xpGrowth} XP a mais que semana passada. O que fez diferente?`,
        type: 'reflection',
        priority: 'medium'
      });
    } else if (xpGrowth < 0) {
      questions.push({
        id: 'decline',
        text: `Você ganhou ${Math.abs(xpGrowth)} XP a menos que semana passada. O que dificultou?`,
        type: 'reflection',
        priority: 'medium'
      });
    }
  }

  questions.push({
    id: 'challenges',
    text: 'O que foi mais desafiador esta semana?',
    type: 'reflection',
    priority: 'medium'
  });

  questions.push({
    id: 'improve',
    text: 'O que você quer melhorar na próxima semana?',
    type: 'goal',
    priority: 'high'
  });

  questions.push({
    id: 'goals',
    text: 'Quais são suas 3 principais metas para a próxima semana?',
    type: 'goal',
    priority: 'high'
  });

  return questions;
}

function generateWeeklyReviewText(currentWeek, previousWeek, objectives, checkins, questions) {
  let text = '';
  text += '╔════════════════════════════════════════════════════════════╗\n';
  text += '║           WEEKLY REVIEW - REVISÃO SEMANAL                    ║\n';
  text += '╚════════════════════════════════════════════════════════════╝\n\n';

  // Estatísticas
  text += '📊 ESTATÍSTICAS DA SEMANA\n';
  text += '='.repeat(60) + '\n\n';

  if (currentWeek) {
    text += `  🎯 Quests Completadas:     ${currentWeek.quests_completed || 0}\n`;
    text += `  ✅ Milestones Completados: ${currentWeek.milestones_completed || 0}\n`;
    text += `  ⭐ XP Total Ganho:         ${currentWeek.xp_earned || 0}\n`;
    text += `  📅 Dias Ativos:            ${currentWeek.active_days || 0}\n`;
    text += `  🔥 Maior Streak:           ${currentWeek.longest_streak || 0} dias\n\n`;
  }

  // Comparação
  if (currentWeek && previousWeek) {
    text += '📈 COMPARAÇÃO COM SEMANA ANTERIOR\n';
    text += '='.repeat(60) + '\n\n';

    const xpDiff = currentWeek.xp_earned - previousWeek.xp_earned;
    const milestonesDiff = currentWeek.milestones_completed - previousWeek.milestones_completed;

    text += `  ⭐ XP: ${xpDiff >= 0 ? '+' : ''}${xpDiff}`;
    text += xpDiff >= 0 ? ' 📈' : ' 📉';
    text += `\n  ✅ Milestones: ${milestonesDiff >= 0 ? '+' : ''}${milestonesDiff}`;
    text += milestonesDiff >= 0 ? ' 📈' : ' 📉';
    text += '\n\n';
  }

  // Progresso dos objetivos
  if (objectives.length > 0) {
    text += '🎯 PROGRESSO DOS OBJETIVOS\n';
    text += '='.repeat(60) + '\n\n';

    objectives.forEach((obj, index) => {
      text += `  ${index + 1}. ${obj.statement.substring(0, 50)}...\n`;
      text += `     Quests completadas: ${obj.quests_completed || 0}\n\n`;
    });
  }

  // Check-ins
  if (checkins.length > 0) {
    text += '📝 CHECK-INS DA SEMANA\n';
    text += '='.repeat(60) + '\n\n';

    checkins.slice(0, 5).forEach(checkin => {
      const date = new Date(checkin.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
      const content = typeof checkin.content === 'string' ? JSON.parse(checkin.content) : checkin.content;
      
      text += `  ${date} | Mood: ${checkin.mood || 'N/A'}\n`;
      if (content && content.highlights) {
        text += `     ${content.highlights.substring(0, 60)}...\n`;
      }
      text += '\n';
    });
  }

  // Perguntas reflexivas
  text += '💭 PERGUNTAS REFLEXIVAS\n';
  text += '='.repeat(60) + '\n\n';

  questions.forEach((q, _index) => {
    const priorityIcon = q.priority === 'high' ? '⭐' : '💡';
    text += `  ${priorityIcon} ${q.text}\n\n`;
  });

  text += '='.repeat(60) + '\n';
  text += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
  text += '='.repeat(60) + '\n';

  return text;
}

// Salvar resposta da weekly review
export async function saveWeeklyReviewResponse(sessionId, weekStart, answers) {
  const pool = getPool();

  const result = await pool.query(`
    INSERT INTO weekly_reviews (
      session_id,
      week_start,
      answers,
      created_at
    ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    RETURNING id
  `, [sessionId, weekStart, JSON.stringify(answers)]);

  return result.rows[0].id;
}
