import { getPool } from './db.js';

// Analisar padrões de produtividade
export async function analyzeProductivityPatterns(sessionId) {
  const pool = getPool();

  // Produtividade por dia da semana (último mês)
  const dayOfWeekResult = await pool.query(`
    SELECT 
      EXTRACT(DOW FROM completed_at) as day_of_week,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as milestones_completed,
      COALESCE(SUM(current_xp), 0) as xp_earned
    FROM quests
    WHERE session_id = $1
      AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY day_of_week
    ORDER BY day_of_week
  `, [sessionId]);

  // Produtividade por hora (último mês)
  const hourlyResult = await pool.query(`
    SELECT 
      EXTRACT(HOUR FROM completed_at) as hour,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as milestones_completed,
      COALESCE(SUM(current_xp), 0) as xp_earned
    FROM quests
    WHERE session_id = $1
      AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY hour
    HAVING COUNT(CASE WHEN status = 'completed' THEN 1 END) > 0
    ORDER BY xp_earned DESC
    LIMIT 5
  `, [sessionId]);

  // Correlação check-in x produtividade
  const checkinCorrelationResult = await pool.query(`
    SELECT 
      DATE(q.completed_at) as date,
      COUNT(CASE WHEN q.status = 'completed' THEN 1 END) as milestones_completed,
      COUNT(DISTINCT CASE WHEN qj.entry_type = 'daily_checkin' THEN qj.id END) as checkin_count
    FROM quests q
    LEFT JOIN nlp_objectives o ON o.session_id = q.session_id
    LEFT JOIN quest_journal qj ON qj.quest_id::text = o.id::text AND DATE(qj.created_at) = DATE(q.completed_at)
    WHERE q.session_id = $1
      AND q.completed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(q.completed_at)
  `, [sessionId]);

  const insights = [];

  // Análise de dias mais produtivos
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const mostProductiveDay = dayOfWeekResult.rows.reduce((max, row) => 
    row.milestones_completed > max.milestones_completed ? row : max
  , { milestones_completed: 0, day_of_week: 0 });

  if (mostProductiveDay.milestones_completed > 0) {
    const avgMilestones = dayOfWeekResult.rows.reduce((sum, row) => 
      sum + row.milestones_completed, 0
    ) / Math.max(dayOfWeekResult.rows.length, 1);

    const ratio = mostProductiveDay.milestones_completed / Math.max(avgMilestones, 1);

    if (ratio >= 1.5) {
      insights.push({
        type: 'most_productive_day',
        title: 'Dia Mais Produtivo: ' + dayNames[Math.floor(mostProductiveDay.day_of_week)],
        description: 'Você completa ' + mostProductiveDay.milestones_completed + ' milestones em ' + dayNames[Math.floor(mostProductiveDay.day_of_week)] + ' (média: ' + avgMilestones.toFixed(1) + ').',
        impact: 'high',
        recommendation: 'Tente agendar tarefas importantes para ' + dayNames[Math.floor(mostProductiveDay.day_of_week)] + '.'
      });
    }
  }

  // Análise de horários mais produtivos
  if (hourlyResult.rows.length > 0) {
    const bestHour = hourlyResult.rows[0];
    insights.push({
      type: 'best_hour',
      title: 'Melhor Horário: ' + String(Math.floor(bestHour.hour)).padStart(2, '0') + ':00',
      description: 'Você ganha ' + bestHour.xp_earned + ' XP às ' + String(Math.floor(bestHour.hour)).padStart(2, '0') + ':00 em média.',
      impact: 'medium',
      recommendation: 'Tente trabalhar em tarefas importantes às ' + String(Math.floor(bestHour.hour)).padStart(2, '0') + ':00.'
    });
  }

  // Correlação check-in x produtividade
  const daysWithCheckin = checkinCorrelationResult.rows.filter(r => r.checkin_count > 0);
  const daysWithoutCheckin = checkinCorrelationResult.rows.filter(r => r.checkin_count === 0);

  if (daysWithCheckin.length > 0 && daysWithoutCheckin.length > 0) {
    const avgWithCheckin = daysWithCheckin.reduce((sum, r) => sum + r.milestones_completed, 0) / daysWithCheckin.length;
    const avgWithoutCheckin = daysWithoutCheckin.reduce((sum, r) => sum + r.milestones_completed, 0) / daysWithoutCheckin.length;

    const ratio = avgWithCheckin / Math.max(avgWithoutCheckin, 1);

    if (ratio >= 1.5) {
      insights.push({
        type: 'checkin_correlation',
        title: 'Check-ins Aumentam Produtividade!',
        description: 'Dias com check-in têm ' + ratio.toFixed(1) + 'x mais conclusões.',
        impact: 'high',
        recommendation: 'Continue fazendo check-ins diários!'
      });
    }
  }

  return insights;
}

// Previsão de conclusão de objetivo
export async function predictObjectiveCompletion(sessionId, objectiveId) {
  const pool = getPool();

  // Buscar histórico de quests completadas por dia
  const historyResult = await pool.query(`
    SELECT 
      DATE(completed_at) as date,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as milestones_completed
    FROM quests
    WHERE session_id = $1
      AND completed_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE(completed_at)
    ORDER BY date DESC
  `, [sessionId]);

  if (historyResult.rows.length === 0) {
    return null;
  }

  // Calcular média de conclusões por dia
  const avgMilestonesPerDay = historyResult.rows.reduce((sum, row) => 
    sum + row.milestones_completed, 0
  ) / historyResult.rows.length;

  // Buscar quest do objetivo
  const questResult = await pool.query(`
    SELECT 
      COUNT(*) as total_milestones
    FROM quest_milestones
    WHERE quest_id IN (SELECT id FROM quests WHERE parent_goal_id = $1)
  `, [objectiveId]);

  const totalMilestones = questResult.rows[0].total_milestones;

  if (totalMilestones === 0) {
    return null;
  }

  // Prever dias até conclusão
  const daysToCompletion = Math.ceil(totalMilestones / Math.max(avgMilestonesPerDay, 0.1));
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysToCompletion);

  return {
    totalMilestones,
    avgMilestonesPerDay: avgMilestonesPerDay.toFixed(2),
    daysToCompletion,
    completionDate: completionDate.toISOString(),
    confidence: daysToCompletion > 0 ? 'medium' : 'low'
  };
}

// Gerar insights automáticos
export async function generateAIInsights(sessionId) {
  const insights = await analyzeProductivityPatterns(sessionId);

  // Buscar objetivos ativos
  const pool = getPool();
  const objectivesResult = await pool.query(`
    SELECT id, statement FROM nlp_objectives 
    WHERE session_id = $1 AND status = 'active'
  `, [sessionId]);

  const predictions = [];

  for (const objective of objectivesResult.rows) {
    const prediction = await predictObjectiveCompletion(sessionId, objective.id);
    if (prediction) {
      predictions.push({
        objective: objective.statement,
        prediction
      });
    }
  }

  return {
    insights,
    predictions,
    generatedAt: new Date().toISOString()
  };
}

// Formatar insights como texto
export function formatInsightsAsText(insights) {
  let text = 'Insights Automaticos\n';
  text += '='.repeat(40) + '\n\n';

  insights.insights.forEach((insight, index) => {
    text += (index + 1) + '. ' + insight.title + '\n';
    text += '   ' + insight.description + '\n';
    if (insight.recommendation) {
      text += '   ' + insight.recommendation + '\n';
    }
    text += '\n';
  });

  if (insights.predictions.length > 0) {
    text += 'Previsoes de Conclusao\n';
    text += '='.repeat(40) + '\n\n';

    insights.predictions.forEach((pred, index) => {
      const completionDate = new Date(pred.prediction.completionDate);
      text += (index + 1) + '. ' + pred.objective.substring(0, 50) + '...\n';
      text += '   Concluira em: ' + completionDate.toLocaleDateString('pt-BR') + ' (' + pred.prediction.daysToCompletion + ' dias)\n';
      text += '   Confianca: ' + pred.prediction.confidence + '\n\n';
    });
  }

  return text;
}
