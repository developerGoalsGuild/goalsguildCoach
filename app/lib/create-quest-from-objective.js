/**
 * Cria uma quest a partir de um objetivo (goal)
 * Usado pelo chat e pela API /api/quests/from-objective
 * Gera tarefas reais via LLM considerando memória e impedimentos
 */

import { getPool } from './db';
import { generateAndInsertQuestTasks } from './generate-quest-tasks';
import { checkSubscriptionLimit } from './subscription.js';

function generateQuestTitle(objective) {
  const title = objective.title || objective.statement || 'Quest';
  return (objective.category ? `${title} [${objective.category}]` : title).substring(0, 100);
}

function generateQuestDescription(objective) {
  let description = `**Objetivo:** ${objective.title || objective.statement}\n\n`;
  if (objective.nlp_criteria_positive) description += `**O que você QUER:** ${objective.nlp_criteria_positive}\n`;
  if (objective.nlp_criteria_sensory) description += `**Visualização:** ${objective.nlp_criteria_sensory}\n`;
  if (objective.nlp_criteria_compelling) description += `**Motivação:** ${objective.nlp_criteria_compelling}\n`;
  if (objective.nlp_criteria_ecology) description += `**Ecologia:** ${objective.nlp_criteria_ecology}\n`;
  if (objective.nlp_criteria_self_initiated) description += `**No seu controle:** ${objective.nlp_criteria_self_initiated}\n`;
  if (objective.nlp_criteria_context) description += `**Contexto:** ${objective.nlp_criteria_context}\n`;
  if (objective.nlp_criteria_resources) description += `**Recursos:** ${objective.nlp_criteria_resources}\n`;
  if (objective.nlp_criteria_evidence) description += `**Como vou saber:** ${objective.nlp_criteria_evidence}\n`;
  return description;
}

function inferDifficulty(objective) {
  const isNLPComplete = objective.is_nlp_complete;
  const hasResources = objective.nlp_criteria_resources?.length > 0;
  const hasEvidence = objective.nlp_criteria_evidence?.length > 0;
  if (isNLPComplete && hasResources && hasEvidence) return 'epic';
  if (hasResources || hasEvidence) return 'hard';
  if (isNLPComplete) return 'medium';
  return 'easy';
}

function inferXPReward(objective) {
  const difficulty = inferDifficulty(objective);
  const xpMap = { trivial: 50, easy: 100, medium: 200, hard: 400, epic: 800 };
  return xpMap[difficulty] || 100;
}

function generateMilestones(objective) {
  const milestones = [];
  let orderIndex = 0;
  if (objective.is_nlp_complete) {
    if (objective.nlp_criteria_resources) milestones.push({ title: 'Preparação de Recursos', description: `Cultivar: ${objective.nlp_criteria_resources}`, order: orderIndex++ });
    if (objective.nlp_criteria_context) milestones.push({ title: 'Contexto Inicializado', description: `Configurar: ${objective.nlp_criteria_context}`, order: orderIndex++ });
    if (objective.nlp_criteria_positive) milestones.push({ title: 'Progresso Visível', description: `Alcançar: ${objective.nlp_criteria_positive}`, order: orderIndex++ });
    if (objective.nlp_criteria_evidence) milestones.push({ title: 'Evidência Confirmada', description: `Verificar: ${objective.nlp_criteria_evidence}`, order: orderIndex++ });
  }
  if (milestones.length === 0) {
    milestones.push({ title: 'Início', description: 'Começar jornada', order: 0 });
    milestones.push({ title: 'Progresso', description: objective.description || objective.title, order: 1 });
    milestones.push({ title: 'Conclusão', description: 'Objetivo atingido!', order: 2 });
  }
  return milestones;
}

/**
 * Cria quest a partir de objetivo. Retorna { success, questId, title, milestones, error }
 */
export async function createQuestFromObjective(sessionId, objectiveId) {
  const pool = getPool();
  try {
    const questsTotalCheck = await checkSubscriptionLimit(sessionId, 'quests');
    if (!questsTotalCheck.allowed) {
      return { success: false, error: questsTotalCheck.message || 'Quest limit reached. Upgrade your plan for more.' };
    }
    const limitCheck = await checkSubscriptionLimit(sessionId, 'quests_ai');
    if (!limitCheck.allowed) {
      return { success: false, error: limitCheck.message || 'Quest AI limit reached for this month.' };
    }

    const objectiveResult = await pool.query(`
      SELECT id as objective_id, title, statement, description, category,
        nlp_criteria_positive, nlp_criteria_sensory, nlp_criteria_compelling,
        nlp_criteria_ecology, nlp_criteria_self_initiated, nlp_criteria_context,
        nlp_criteria_resources, nlp_criteria_evidence, is_nlp_complete, target_date
      FROM goals
      WHERE id::text = $1::text AND session_id = $2::text
    `, [objectiveId, sessionId]);

    if (objectiveResult.rows.length === 0) {
      return { success: false, error: 'Objective not found' };
    }

    const objective = objectiveResult.rows[0];

    // Detectar colunas existentes na tabela quests (schemas variam)
    const colResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'quests' AND table_schema = 'public'
    `);
    const cols = colResult.rows.map(r => r.column_name);
    const has = (n) => cols.includes(n);

    const userCol = has('user_id') ? 'user_id' : 'session_id';
    const insertCols = [userCol, 'parent_goal_id', 'title', 'description', 'difficulty', 'status'];
    const insertVals = [sessionId, objectiveId, generateQuestTitle(objective), generateQuestDescription(objective), inferDifficulty(objective), 'planning'];

    if (has('quest_type')) { insertCols.push('quest_type'); insertVals.push('main'); }
    if (has('xp_reward')) { insertCols.push('xp_reward'); insertVals.push(inferXPReward(objective)); }
    if (has('estimated_xp')) { insertCols.push('estimated_xp'); insertVals.push(inferXPReward(objective)); }
    if (has('start_date')) { insertCols.push('start_date'); insertVals.push(new Date()); }
    if (has('target_date')) { insertCols.push('target_date'); insertVals.push(objective.target_date || null); }
    if (has('created_by_ai')) { insertCols.push('created_by_ai'); insertVals.push(true); }

    const placeholders = insertCols.map((_, i) => `$${i + 1}`).join(', ');
    const questResult = await pool.query(`
      INSERT INTO quests (${insertCols.join(', ')})
      VALUES (${placeholders})
      RETURNING id
    `, insertVals);

    const questId = questResult.rows[0].id;
    const milestones = generateMilestones(objective);

    // Usar quest_milestones (padrão coerente com quest_journal)
    const msTableResult = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('quest_milestones', 'milestones')
    `);
    const msTable = msTableResult.rows.some(r => r.table_name === 'quest_milestones') ? 'quest_milestones' : 'milestones';
    const msColsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
    `, [msTable]);
    const msCols = msColsResult.rows.map(r => r.column_name);
    const hasOrderIndex = msCols.includes('order_index');

    for (const m of milestones) {
      if (hasOrderIndex) {
        await pool.query(`
          INSERT INTO ${msTable} (quest_id, title, description, status, order_index)
          VALUES ($1, $2, $3, $4, $5)
        `, [questId, m.title, m.description, 'pending', m.order]);
      } else {
        await pool.query(`
          INSERT INTO ${msTable} (quest_id, title, description, status)
          VALUES ($1, $2, $3, $4)
        `, [questId, m.title, m.description, 'pending']);
      }
    }

    // Gerar tarefas reais via LLM (considera memória, impedimentos, max 24h/tarefa)
    const tasksResult = await generateAndInsertQuestTasks(
      sessionId,
      questId,
      objectiveId,
      objective
    );
    if (tasksResult.success) {
      console.log(`[createQuestFromObjective] ${tasksResult.count} tasks generated via LLM`);
    }

    return {
      success: true,
      questId,
      title: generateQuestTitle(objective),
      milestones: milestones.length,
      xp_reward: inferXPReward(objective)
    };
  } catch (error) {
    console.error('[createQuestFromObjective] Error:', error);
    return { success: false, error: error.message };
  }
}
