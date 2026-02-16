/**
 * API do Chat com Sistema de Perguntas NLP via LLM
 * Integrado com OpenAI GPT-4o-mini para coleta inteligente de objetivos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { checkMessagePolicy } from '../../lib/guardrails';
import nlpQuestionLLM from '../../lib/nlp-llm-questions';
import { createQuestFromObjective } from '../../lib/create-quest-from-objective';
import { getUserFromToken } from '../../lib/auth';
import { getCoachResponse } from '../../lib/openai';

/**
 * Armazena objetivos pendentes de aprovação
 */
const pendingObjectives = new Map();

/**
 * Último objetivo salvo por sessão (para criar quest quando usuário diz "sim")
 */
const lastSavedObjectives = new Map();

/**
 * Verifica se mensagem é aprovação
 */
function isApprovalMessage(message) {
  const lower = message.toLowerCase().trim();
  const approvalPatterns = [
    /^sim$/i,
    /^salvar$/i,
    /^pode salvar$/i,
    /^confirmar$/i,
    /^salvar sim$/i
  ];

  return approvalPatterns.some(pattern => pattern.test(lower));
}

/**
 * Verifica se mensagem é rejeição
 */
function isRejectionMessage(message) {
  const lower = message.toLowerCase().trim();
  const rejectionPatterns = [
    /^não$/i,
    /^no$/i,
    /^cancelar$/i,
    /^não salvar$/i,
    /^nao$/i
  ];

  return rejectionPatterns.some(pattern => pattern.test(lower));
}

/**
 * Verifica se mensagem é pedido para criar quest (após oferecer criar)
 */
function isCreateQuestRequest(message) {
  const lower = message.toLowerCase().trim();
  const patterns = [
    /^sim$/i,
    /^quero$/i,
    /^criar$/i,
    /^cria$/i,
    /^criar quest$/i,
    /^pode criar$/i,
    /^por favor cria/i,
    /^quero que crie/i,
    /^crie a quest$/i
  ];
  return patterns.some(p => p.test(lower));
}

/**
 * Gera memória formatada para objetivo NLP
 */
function generateNLPMemory(objective) {
  return `
**Objetivo NLP Completo: ${objective.title}**

📝 **Declaração:**
${objective.statement}

✅ **Critérios NLP:**

1. **Positivo:** ${objective.nlp_criteria_positive || 'Não informado'}
2. **Sensório:** ${objective.nlp_criteria_sensory || 'Não informado'}
3. **Motivador:** ${objective.nlp_criteria_compelling || 'Não informado'}
4. **Ecologia:** ${objective.nlp_criteria_ecology || 'Não informado'}
5. **Auto-iniciado:** ${objective.nlp_criteria_self_initiated || 'Não informado'}
6. **Contexto:** ${objective.nlp_criteria_context || 'Não informado'}
7. **Recursos:** ${objective.nlp_criteria_resources || 'Não informado'}
8. **Evidência:** ${objective.nlp_criteria_evidence || 'Não informado'}

📅 **Data Alvo:** ${objective.target_date || 'Não definida'}

🏷️ **Categoria:** ${objective.category || 'other'}

---

**Objetivo criado em:** ${new Date().toLocaleDateString('pt-BR')}
  `.trim();
}

/**
 * Salva objetivo NLP no banco
 */
function normalizeTargetDate(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  const s = value.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return value;
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const semanasMatch = s.match(/(\d+)\s+semana[s]?/);
  if (semanasMatch) {
    const d2 = new Date();
    d2.setDate(d2.getDate() + parseInt(semanasMatch[1], 10) * 7);
    return d2.toISOString().split('T')[0];
  }
  const mesesMatch = s.match(/(\d+)\s+mes(?:es)?/);
  if (mesesMatch) {
    const d2 = new Date();
    d2.setMonth(d2.getMonth() + parseInt(mesesMatch[1], 10));
    return d2.toISOString().split('T')[0];
  }
  return null;
}

async function saveNLPOjective(pool, sessionId, objective) {
  try {
    const title = objective.title || objective.statement?.substring(0, 100) || 'Objetivo';
    const targetDate = normalizeTargetDate(objective.target_date);

    console.log('[NLP Save] Salvando objetivo NLP:', title);

    const result = await pool.query(
      `INSERT INTO goals (
        session_id,
        title,
        description,
        statement,
        category,
        target_date,
        is_nlp_complete,
        nlp_criteria_positive,
        nlp_criteria_sensory,
        nlp_criteria_compelling,
        nlp_criteria_ecology,
        nlp_criteria_self_initiated,
        nlp_criteria_context,
        nlp_criteria_resources,
        nlp_criteria_evidence,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        sessionId,
        title,
        objective.description || objective.statement,
        objective.statement,
        objective.category,
        targetDate,
        true,
        objective.nlp_criteria_positive,
        objective.nlp_criteria_sensory,
        objective.nlp_criteria_compelling,
        objective.nlp_criteria_ecology,
        objective.nlp_criteria_self_initiated,
        objective.nlp_criteria_context,
        objective.nlp_criteria_resources,
        objective.nlp_criteria_evidence,
        'active'
      ]
    );

    const goalId = result.rows[0].id;
    console.log('[NLP Save] Objetivo NLP salvo com ID:', goalId);

    return { success: true, objectiveId: goalId, title };
  } catch (error) {
    console.error('[NLP Save] Erro ao salvar objetivo NLP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Salva memória do objetivo
 */
async function saveObjectiveMemory(pool, sessionId, objectiveId, memory) {
  try {
    const result = await pool.query(
      `INSERT INTO objective_memories (
        objective_id,
        session_id,
        memory,
        created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING id`,
      [objectiveId, sessionId, memory]
    );

    console.log('[NLP Save] Memória salva com ID:', result.rows[0].id);
    return { success: true };
  } catch (error) {
    console.error('[NLP Save] Erro ao salvar memória:', error);
    return { success: false, error: error.message };
  }
}

export async function POST(request) {
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid or missing token' }, { status: 401 });
  }

  const sessionId = user.userId;

  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = getPool();

    // Ensure persona columns exist
    try {
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_tone VARCHAR(50) DEFAULT \'neutral\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_specialization VARCHAR(50) DEFAULT \'general\'');
      await pool.query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS persona_archetype VARCHAR(50) DEFAULT \'mentor\'');
    } catch (alterErr) {
      console.warn('[chat] Could not add persona columns (may already exist):', alterErr.message);
    }

    // Load persona preferences from sessions table
    let selectCols = 'persona_tone, persona_specialization, persona_archetype';
    try {
      const themeColCheck = await pool.query(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'persona_theme'`
      );
      if (themeColCheck.rows.length > 0) {
        selectCols += ', persona_theme';
      }
    } catch (_) {}

    const personaResult = await pool.query(
      `SELECT ${selectCols} FROM sessions WHERE session_id = $1`,
      [sessionId]
    );
    const persona = personaResult.rows.length > 0 ? {
      tone: personaResult.rows[0].persona_tone || 'neutral',
      specialization: personaResult.rows[0].persona_specialization || 'general',
      archetype: personaResult.rows[0].persona_archetype || 'mentor',
      theme: personaResult.rows[0].persona_theme || null
    } : {
      tone: 'neutral',
      specialization: 'general',
      archetype: 'mentor',
      theme: null
    };

    // ====== GUARDRAILS: MODERAÇÃO ======
    const moderation = checkMessagePolicy(message);

    if (!moderation.allowed) {
      const safeResponse = moderation.response || 'Desculpe, não posso ajudar com esse tipo de solicitação.';

      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );

      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', safeResponse]
      );

      return NextResponse.json({
        message: safeResponse,
        filtered: true,
        reason: moderation.reason
      });
    }
    // ====== FIM DAS GUARDRAILS ======

    // Salvar mensagem do usuário
    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    // Buscar histórico do banco
    const historyResult = await pool.query(
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // ====== VERIFICAR APROVAÇÃO DE OBJETIVO PENDENTE ======
    const pendingKey = `${sessionId}_nlp_pending`;

    if (pendingObjectives.has(pendingKey)) {
      const pendingData = pendingObjectives.get(pendingKey);

      console.log('[NLP Approval] Verificando aprovação de objetivo pendente...');

      // Usuário aprovou?
      if (isApprovalMessage(message)) {
        console.log('[NLP Approval] Objetivo APROVADO pelo usuário!');

        // Salvar objetivo
        const saveResult = await saveNLPOjective(
          pool,
          sessionId,
          pendingData.objective
        );

        if (!saveResult.success) {
          const errorMessage = `❌ Erro ao salvar objetivo: ${saveResult.error}`;

          await pool.query(
            'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
            [sessionId, 'assistant', errorMessage]
          );

          return NextResponse.json({ message: errorMessage });
        }

        // Salvar memória
        const memoryResult = await saveObjectiveMemory(
          pool,
          sessionId,
          saveResult.objectiveId,
          pendingData.memory
        );

        // Remover pendente
        pendingObjectives.delete(pendingKey);

        // Criar quest automaticamente ao aprovar o objetivo
        const questResult = await createQuestFromObjective(sessionId, saveResult.objectiveId);

        let successMessage;
        if (questResult.success) {
          successMessage = memoryResult.success
            ? `✅ **Objetivo NLP salvo com sucesso!**\n\n"${saveResult.title}"\n\n⚔️ **Quest criada automaticamente!**\n\n"${questResult.title}"\n📊 ${questResult.milestones} milestones • ${questResult.xp_reward} XP\n\nVocê pode ver seus objetivos na aba "Objectives" e suas quests na aba "Quests".`
            : `⚠️ Objetivo salvo, mas houve um erro ao salvar a memória. ${memoryResult.error}\n\n⚔️ Quest criada: "${questResult.title}"`;
        } else {
          successMessage = memoryResult.success
            ? `✅ **Objetivo NLP salvo com sucesso!**\n\n"${saveResult.title}"\n\nAgora você pode ver seus objetivos na aba "Objectives".\n\n⚠️ Não foi possível criar a quest automaticamente: ${questResult.error}`
            : `⚠️ Objetivo salvo, mas houve um erro ao salvar a memória. ${memoryResult.error}`;
        }

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', successMessage]
        );

        return NextResponse.json({ message: successMessage });
      }

      // Usuário rejeitou?
      if (isRejectionMessage(message)) {
        console.log('[NLP Approval] Objetivo REJEITADO pelo usuário');

        pendingObjectives.delete(pendingKey);

        const cancelMessage = `Tudo bem! Não salvei o objetivo "${pendingData.objective.title}". Se quiser, podemos conversar mais sobre ele ou criar outro diferente.`;

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', cancelMessage]
        );

        return NextResponse.json({ message: cancelMessage });
      }

      // Se não for aprovação/rejeição, remover o pendente
      console.log('[NLP Approval] Mensagem não é aprovação/rejeição, removendo pendente...');
      pendingObjectives.delete(pendingKey);
    }
    // ====== FIM DA VERIFICAÇÃO DE APROVAÇÃO ======

    // ====== CRIAR QUEST QUANDO USUÁRIO DIZ "SIM" APÓS SALVAR ======
    if (lastSavedObjectives.has(sessionId) && isCreateQuestRequest(message)) {
      const { objectiveId } = lastSavedObjectives.get(sessionId);
      console.log('[Create Quest] Usuário pediu para criar quest do objetivo:', objectiveId);

      const questResult = await createQuestFromObjective(sessionId, objectiveId);

      if (questResult.success) {
        lastSavedObjectives.delete(sessionId);
        const questMessage = `⚔️ **Quest criada com sucesso!**\n\n"${questResult.title}"\n\n📊 ${questResult.milestones} milestones • ${questResult.xp_reward} XP\n\nVocê pode ver e gerenciar suas quests na aba "Quests".`;
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', questMessage]
        );
        return NextResponse.json({ message: questMessage });
      }

      const errorMessage = `❌ Não consegui criar a quest: ${questResult.error}`;
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', errorMessage]
      );
      return NextResponse.json({ message: errorMessage });
    }
    // ====== FIM CRIAR QUEST ======

    // ====== USAR LLM PARA PERGUNTAS NLP ======
    console.log('[NLP LLM] Verificando se deve fazer pergunta NLP...');

    const llmResult = await nlpQuestionLLM.askQuestion(
      sessionId,
      message,
      history,
      persona
    );

    if (llmResult.success) {
      if (llmResult.complete) {
        console.log('[NLP LLM] Objetivo NLP completo detectado!');

        const objective = llmResult.objective;
        const memory = generateNLPMemory(objective);

        // Armazenar objetivo pendente de aprovação
        pendingObjectives.set(pendingKey, {
          objective: objective,
          memory: memory
        });

        // Salvar resposta do assistente
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', llmResult.response]
        );

        return NextResponse.json({
          message: llmResult.response,
          pendingApproval: true,
          objective: objective
        });
      }

      // Ainda coletando informações via LLM
      console.log('[NLP LLM] Coletando informações NLP...');

      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', llmResult.response]
      );

      return NextResponse.json({
        message: llmResult.response
      });
    }

    // LLM falhou ou sem OpenAI key, tentar usar getCoachResponse para conversas gerais
    console.log('[Chat] Tentando usar OpenAI para resposta geral do coach...');
    
    const hasOpenAI = !!process.env.OPENAI_API_KEY && 
                      process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
                      process.env.OPENAI_API_KEY.length > 20;

    if (hasOpenAI) {
      try {
        // Converter histórico para formato esperado por getCoachResponse
        const messagesForOpenAI = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        messagesForOpenAI.push({ role: 'user', content: message });

        const coachResponse = await getCoachResponse(messagesForOpenAI, persona);
        
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', coachResponse]
        );

        return NextResponse.json({ message: coachResponse });
      } catch (openaiError) {
        console.error('[Chat] Erro ao usar OpenAI:', openaiError);
        // Continuar para fallback
      }
    }

    // Fallback sem OpenAI
    console.log('[Chat] Usando fallback sem OpenAI...');
    const fallbackMessage = await processWithoutOpenAI(message, history, pool);

    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', fallbackMessage]
    );

    return NextResponse.json({ message: fallbackMessage });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

/**
 * Processamento sem OpenAI (fallback)
 */
async function processWithoutOpenAI(message, history, pool) {
  const lowerMessage = message.toLowerCase().trim();

  // Detectar intenção
  const intentions = {
    greeting: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
    thanks: ['obrigado', 'valeu', 'thanks', 'agradeço'],
    help: ['ajuda', 'como funciona', 'funciona', 'como usar'],
    goal: ['objetivo', 'meta', 'quero', 'pretendo', 'alcançar']
  };

  let detectedIntention = null;

  for (const [intention, keywords] of Object.entries(intentions)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      detectedIntention = intention;
      break;
    }
  }

  // Respostas contextuais
  const responses = {
    greeting: `Olá! 👋 Eu sou o GoalsGuild Coach!\n\nEstou aqui para ajudá-lo a alcançar seus objetivos. Posso ajudá-lo a:\n\n🎯 Definir objetivos usando os critérios NLP\n⚔️ Criar quests gamificadas\n📊 Acompanhar seu progresso\n🏆 Desbloquear achievements\n\nComo você está hoje? Sinta-se à vontade para me contar sobre seus objetivos!`,

    thanks: `Por nada! 😊 Estou aqui para ajudá-lo!\n\nTem mais alguma coisa em que posso ajudá-lo?`,

    help: `Claro! Vou te explicar como funciona:\n\n**🎯 Definir Objetivos**\nMe conte sobre um objetivo e eu vou te fazer algumas perguntas para entender melhor.\n\n**⚔️ Quests**\nPosso criar quests (jornadas gamificadas) a partir dos seus objetivos.\n\n**📊 Analytics**\nAcompanhe seu progresso e veja insights personalizados.\n\nPor onde você quer começar?`,

    default: `Entendi! Conte-me mais sobre isso.\n\nQuais são seus objetivos? O que você quer alcançar? Estou aqui para ajudá-lo a criar objetivos NLP completos!`
  };

  return responses[detectedIntention] || responses.default;
}
