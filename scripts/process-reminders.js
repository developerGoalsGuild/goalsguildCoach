#!/usr/bin/env node

import { getPool } from './app/lib/db.js';
import { generateCheckInQuestions, generateCheckInMessage, calculateNextCheckIn } from './app/lib/checkin.js';

async function processReminders() {
  const pool = getPool();
  const now = new Date();
  
  console.log(`[${now.toISOString()}] Processando lembretes...`);

  try {
    // Buscar lembretes que precisam ser enviados
    const result = await pool.query(`
      SELECT 
        r.id as reminder_id,
        r.session_id,
        r.objective_id,
        o.statement,
        o.created_at as objective_created
      FROM objective_reminders r
      INNER JOIN nlp_objectives o ON r.objective_id = o.id
      WHERE r.status = 'active'
        AND r.next_check_in <= $1
      ORDER BY r.next_check_in ASC
    `, [now]);

    console.log(`Encontrados ${result.rows.length} lembretes para processar`);

    for (const reminder of result.rows) {
      try {
        // Buscar detalhes completos do objetivo
        const objectiveResult = await pool.query(`
          SELECT 
            statement,
            context_when,
            context_where,
            context_who,
            sensory_visual,
            sensory_auditory,
            sensory_kinesthetic,
            compelling_factor,
            ecology_family_impact,
            ecology_health_impact,
            resources_internal,
            resources_external,
            evidence_i_will_know,
            timeline_start,
            timeline_target
          FROM nlp_objective_details
          WHERE objective_id = $1
        `, [reminder.objective_id]);

        if (objectiveResult.rows.length === 0) {
          console.log(`Aviso: Objetivo ${reminder.objective_id} não encontrado. Pulando.`);
          
          // Desativar lembrete sem objetivo
          await pool.query(
            'UPDATE objective_reminders SET status = $1 WHERE id = $2',
            ['paused', reminder.reminder_id]
          );
          continue;
        }

        const objective = objectiveResult.rows[0];
        
        // Gerar perguntas para check-in
        const questions = generateCheckInQuestions(objective);
        
        // Gerar mensagem
        const message = generateCheckInMessage(objective, questions);
        
        // Inserir mensagem no sistema (como se fosse do coach)
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [reminder.session_id, 'assistant', message]
        );

        // Calcular próximo check-in
        const reminderResult = await pool.query(
          'SELECT frequency FROM objective_reminders WHERE id = $1',
          [reminder.reminder_id]
        );

        if (reminderResult.rows.length > 0) {
          const frequency = reminderResult.rows[0].frequency;
          const nextCheckIn = calculateNextCheckIn(now, frequency);
          
          await pool.query(
            'UPDATE objective_reminders SET next_check_in = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [nextCheckIn, reminder.reminder_id]
          );
        }

        console.log(`✓ Lembrete enviado para session ${reminder.session_id}, objetivo ${reminder.objective_id}`);
      } catch (error) {
        console.error(`Erro ao processar lembrete ${reminder.reminder_id}:`, error);
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
processReminders().then(() => {
  process.exit(0);
});
