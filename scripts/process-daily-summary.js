#!/usr/bin/env node

import { getPool } from './app/lib/db.js';
import { generateEndOfDayMessage } from './app/lib/daily-checkin.js';

async function processDailySummary() {
  const pool = getPool();
  const now = new Date();
  const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

  console.log(`[${now.toISOString()}] Gerando resumos diários...`);

  try {
    // Buscar todos os usuários com objetivos ativos
    const usersResult = await pool.query(`
      SELECT DISTINCT session_id
      FROM nlp_objectives
      WHERE status = 'active'
    `);

    console.log(`Encontrados ${usersResult.rows.length} usuários com objetivos ativos`);

    for (const user of usersResult.rows) {
      try {
        const sessionId = user.session_id;

        // Buscar resumo do dia
        const tasksResult = await pool.query(`
          SELECT 
            COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_tasks,
            SUM(estimated_hours) FILTER (WHERE status = 'completed') as hours_worked
          FROM tasks
          WHERE session_id = $1
            AND DATE(completed_at) = $2
        `, [sessionId, today]);

        const xpResult = await pool.query(`
          SELECT COALESCE(SUM(xp_earned), 0) as total_xp
          FROM streaks
          WHERE session_id = $1
            AND activity_date = $2
        `, [sessionId, today]);

        const objectivesResult = await pool.query(`
          SELECT 
            id,
            statement
          FROM nlp_objectives
          WHERE session_id = $1 AND status = $2
        `, [sessionId, 'active']);

        const summary = {
          completed_tasks: tasksResult.rows[0].completed_tasks || 0,
          pending_tasks: tasksResult.rows[0].pending_tasks || 0,
          hours_worked: parseFloat(tasksResult.rows[0].hours_worked) || 0,
          quests_completed: 0,
          total_xp: xpResult.rows[0].total_xp || 0,
          active_objectives: objectivesResult.rows.length
        };

        // Gerar resumo do dia
        const message = generateEndOfDayMessage(summary);

        if (message) {
          // Salvar resumo como memória do primeiro objetivo ativo
          if (objectivesResult.rows.length > 0) {
            const objectiveId = objectivesResult.rows[0].id;
            
            await pool.query(`
              INSERT INTO quest_journal (
                quest_id,
                entry_type,
                content,
                mood,
                created_at
              ) VALUES ($1, $2, $3, $4, $5)
            `, [
              objectiveId,
              'daily_summary',
              JSON.stringify({
                summary: summary,
                message: message,
                date: today
              }),
              'end_of_day',
              now
            ]);

            console.log(`✓ Resumo diário gerado para session ${sessionId}, objetivo ${objectiveId}`);
          }
        }

      } catch (error) {
        console.error(`Erro ao processar usuário ${user.session_id}:`, error);
      }
    }

    console.log('Processamento concluído!');
  } catch (error) {
    console.error('Erro fatal no processamento:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar
processDailySummary().then(() => {
  process.exit(0);
});
