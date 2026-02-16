/**
 * Gera tarefas reais para uma quest usando LLM
 * Considera a memória do objetivo, inclui tarefa para remover impedimentos
 * Tempo estimado por tarefa: máximo 24 horas (1 dia)
 */

import OpenAI from 'openai';
import { getPool } from './db';
import { TABLES, COLS } from './db-schema';

const TASKS_GENERATION_PROMPT = `Você é um coach especializado em produtividade. Sua tarefa é gerar tarefas CONCRETAS e EXECUTÁVEIS para ajudar o usuário a alcançar um objetivo.

## CONTEXTO DO OBJETIVO (memória NLP):

{objectiveContext}

## REGRAS OBRIGATÓRIAS:

1. **Tarefas reais**: Cada tarefa deve ser uma ação específica que o usuário pode executar HOJE ou em um dia. Ex: "Comprar tênis de corrida", "Definir alarme para 6h nos dias de treino", "Conversar com esposa sobre os dias fixos de treino".

2. **Impedimentos**: OBRIGATÓRIO incluir PELO MENOS UMA tarefa que ajude o usuário a REMOVER ou RESOLVER um impedimento/obstáculo mencionado na ecologia do objetivo (renúncias, fricções). Ex: se o usuário disse que vai "reduzir redes sociais", crie uma tarefa como "Configurar limite de tempo no celular para redes sociais" ou "Definir horário fixo de 15min para redes sociais".

3. **Tempo máximo**: Cada tarefa deve ter estimated_hours entre 0.25 e 24. NENHUMA tarefa pode ultrapassar 24 horas (1 dia). Prefira tarefas de 0.5h a 4h.

4. **Ordem lógica**: Coloque primeiro as tarefas que removem impedimentos ou preparam o terreno, depois as de execução.

5. **Quantidade**: Gere entre 5 e 12 tarefas, dependendo da complexidade do objetivo.

## FORMATO DE RESPOSTA (JSON):

Responda APENAS com um JSON válido, sem markdown ou texto extra:

[
  {"title": "Título curto da tarefa", "description": "Descrição opcional", "estimated_hours": 1.5},
  {"title": "Outra tarefa", "description": "", "estimated_hours": 0.5}
]

- title: string, obrigatório, máximo 100 caracteres
- description: string, opcional
- estimated_hours: number, obrigatório, entre 0.25 e 24`;

/**
 * Busca memória do objetivo
 */
async function getObjectiveMemory(pool, objectiveId, sessionId) {
  try {
    const result = await pool.query(
      `SELECT memory FROM objective_memories 
       WHERE objective_id::text = $1::text AND session_id = $2::text 
       ORDER BY created_at DESC LIMIT 1`,
      [objectiveId, sessionId]
    );
    return result.rows[0]?.memory || null;
  } catch (e) {
    console.warn('[generateQuestTasks] objective_memories not available:', e.message);
    return null;
  }
}

/**
 * Monta contexto do objetivo para o prompt
 */
function buildObjectiveContext(objective, memory) {
  let ctx = `
**Título:** ${objective.title || objective.statement || 'Objetivo'}
**Declaração:** ${objective.statement || objective.description || '-'}
**Descrição:** ${objective.description || '-'}

**Critérios NLP:**
- Positivo (o que quer): ${objective.nlp_criteria_positive || '-'}
- Sensório (vê, ouve, sente): ${objective.nlp_criteria_sensory || '-'}
- Motivador: ${objective.nlp_criteria_compelling || '-'}
- Ecologia (renúncias + como resolver fricções): ${objective.nlp_criteria_ecology || '-'}
- Auto-iniciado: ${objective.nlp_criteria_self_initiated || '-'}
- Contexto (quando, onde): ${objective.nlp_criteria_context || '-'}
- Recursos: ${objective.nlp_criteria_resources || '-'}
- Evidência (como saber que alcançou): ${objective.nlp_criteria_evidence || '-'}

**Data alvo:** ${objective.target_date || '-'}
`;

  if (memory) {
    ctx += `\n**Memória completa do objetivo:**\n${memory}\n`;
  }

  return ctx.trim();
}

/**
 * Parseia resposta JSON do LLM
 */
function parseTasksResponse(text) {
  try {
    let jsonStr = text.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(t => t && typeof t.title === 'string')
      .map(t => ({
        title: String(t.title).substring(0, 200),
        description: t.description ? String(t.description).substring(0, 500) : '',
        estimated_hours: Math.min(24, Math.max(0.25, parseFloat(t.estimated_hours) || 1))
      }));
  } catch (e) {
    console.error('[generateQuestTasks] Parse error:', e.message);
    return [];
  }
}

/**
 * Gera tarefas via LLM e insere na tasks_table
 * Retorna { success, count, error }
 */
export async function generateAndInsertQuestTasks(sessionId, questId, objectiveId, objective) {
  const pool = getPool();

  const hasOpenAI = !!process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
    process.env.OPENAI_API_KEY.length > 20;

  if (!hasOpenAI) {
    console.log('[generateQuestTasks] No OpenAI key, skipping LLM task generation');
    return { success: false, count: 0, error: 'OpenAI not configured' };
  }

  try {
    const memory = await getObjectiveMemory(pool, objectiveId, sessionId);
    const objectiveContext = buildObjectiveContext(objective, memory);

    const prompt = TASKS_GENERATION_PROMPT.replace('{objectiveContext}', objectiveContext);

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Você gera tarefas em JSON. Responda APENAS com o array JSON, sem explicações.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = completion.choices[0]?.message?.content || '';
    const tasks = parseTasksResponse(content);

    if (tasks.length === 0) {
      console.log('[generateQuestTasks] No valid tasks parsed from LLM');
      return { success: false, count: 0, error: 'No tasks generated' };
    }

    const questIdStr = String(questId);

    for (const t of tasks) {
      await pool.query(
        `INSERT INTO ${TABLES.tasks} (${COLS.questsUser}, quest_id, title, description, estimated_hours, status)
         VALUES ($1::text, $2::text, $3, $4, $5, 'pending')`,
        [sessionId, questIdStr, t.title, t.description || '', t.estimated_hours]
      );
    }

    console.log(`[generateQuestTasks] Created ${tasks.length} tasks for quest ${questIdStr}`);
    return { success: true, count: tasks.length };
  } catch (error) {
    console.error('[generateQuestTasks] Error:', error);
    return { success: false, count: 0, error: error.message };
  }
}
