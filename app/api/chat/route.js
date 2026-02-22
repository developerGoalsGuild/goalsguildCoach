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
import { getCoachResponse, rewriteWithPersona } from '../../lib/openai';
import { checkSubscriptionLimit, incrementDailyMessageUsage } from '../../lib/subscription.js';

/**
 * Armazena objetivos pendentes de aprovação
 */
const pendingObjectives = new Map();

/** Coach UI strings by locale (for API responses: moderation, approval, quest, help) */
const COACH_STRINGS = {
  'pt-BR': {
    moderationBlock: 'Desculpe, não posso ajudar com esse tipo de solicitação.',
    objectiveSavedWithQuest: (title, questTitle, milestones, xp) => `✅ **Objetivo NLP salvo com sucesso!**\n\n"${title}"\n\n⚔️ **Quest criada automaticamente!**\n\n"${questTitle}"\n📊 ${milestones} milestones • ${xp} XP\n\nVocê pode ver seus objetivos na aba "Objectives" e suas quests na aba "Quests".`,
    objectiveSavedNoQuest: (title, err) => `✅ **Objetivo NLP salvo com sucesso!**\n\n"${title}"\n\nAgora você pode ver seus objetivos na aba "Objectives".\n\n⚠️ Não foi possível criar a quest automaticamente: ${err}`,
    objectiveSavedQuestError: (title, questTitle, memErr) => `⚠️ Objetivo salvo, mas houve um erro ao salvar a memória. ${memErr}\n\n⚔️ Quest criada: "${questTitle}"`,
    objectiveRejected: (title) => `Tudo bem! Não salvei o objetivo "${title}". Se quiser, podemos conversar mais sobre ele ou criar outro diferente.`,
    questCreated: (title, milestones, xp) => `⚔️ **Quest criada com sucesso!**\n\n"${title}"\n\n📊 ${milestones} milestones • ${xp} XP\n\nVocê pode ver e gerenciar suas quests na aba "Quests".`,
    questCreateError: (err) => `❌ Não consegui criar a quest: ${err}`,
    objectiveSaveError: (err) => `❌ Erro ao salvar objetivo: ${err}`,
  },
  'en-US': {
    moderationBlock: 'Sorry, I can\'t help with that type of request.',
    objectiveSavedWithQuest: (title, questTitle, milestones, xp) => `✅ **NLP objective saved successfully!**\n\n"${title}"\n\n⚔️ **Quest created automatically!**\n\n"${questTitle}"\n📊 ${milestones} milestones • ${xp} XP\n\nYou can view your objectives in the "Objectives" tab and your quests in the "Quests" tab.`,
    objectiveSavedNoQuest: (title, err) => `✅ **NLP objective saved successfully!**\n\n"${title}"\n\nYou can now view your objectives in the "Objectives" tab.\n\n⚠️ Could not create the quest automatically: ${err}`,
    objectiveSavedQuestError: (title, questTitle, memErr) => `⚠️ Objective saved, but there was an error saving memory. ${memErr}\n\n⚔️ Quest created: "${questTitle}"`,
    objectiveRejected: (title) => `No problem! I didn\'t save the objective "${title}". If you\'d like, we can talk more about it or create a different one.`,
    questCreated: (title, milestones, xp) => `⚔️ **Quest created successfully!**\n\n"${title}"\n\n📊 ${milestones} milestones • ${xp} XP\n\nYou can view and manage your quests in the "Quests" tab.`,
    questCreateError: (err) => `❌ Could not create the quest: ${err}`,
    objectiveSaveError: (err) => `❌ Error saving objective: ${err}`,
  },
};

function getCoachStrings(locale) {
  return COACH_STRINGS[locale] || COACH_STRINGS['pt-BR'];
}

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

    const goalsCols = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'goals' AND column_name IN ('user_id', 'session_id')`
    );
    const hasUserId = goalsCols.rows.some((r) => r.column_name === 'user_id');
    const insertCols = ['session_id', 'title', 'description', 'statement', 'category', 'target_date', 'is_nlp_complete', 'nlp_criteria_positive', 'nlp_criteria_sensory', 'nlp_criteria_compelling', 'nlp_criteria_ecology', 'nlp_criteria_self_initiated', 'nlp_criteria_context', 'nlp_criteria_resources', 'nlp_criteria_evidence', 'status', 'created_by_ai'];
    const insertVals = [sessionId, title, objective.description || objective.statement, objective.statement, objective.category, targetDate, true, objective.nlp_criteria_positive, objective.nlp_criteria_sensory, objective.nlp_criteria_compelling, objective.nlp_criteria_ecology, objective.nlp_criteria_self_initiated, objective.nlp_criteria_context, objective.nlp_criteria_resources, objective.nlp_criteria_evidence, 'active', true];
    if (hasUserId) {
      insertCols.unshift('user_id');
      insertVals.unshift(sessionId);
    }
    const placeholders = insertVals.map((_, i) => `$${i + 1}`).join(', ');
    const result = await pool.query(
      `INSERT INTO goals (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      insertVals
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
    const { message, locale = 'pt-BR' } = await request.json();
    const coachStrings = getCoachStrings(locale);

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const messagesLimit = await checkSubscriptionLimit(sessionId, 'messages');
    if (!messagesLimit.allowed) {
      return NextResponse.json(
        { error: messagesLimit.message || "You've reached your daily message limit. Upgrade your plan for more." },
        { status: 403 }
      );
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
      const safeResponse = moderation.response || coachStrings.moderationBlock;

      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );
      await incrementDailyMessageUsage(sessionId);

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
    await incrementDailyMessageUsage(sessionId);

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

        const objectivesLimit = await checkSubscriptionLimit(sessionId, 'objectives_ai');
        if (!objectivesLimit.allowed) {
          const limitMessage = objectivesLimit.message || "You've reached your AI objectives limit this month. Upgrade your plan for more.";
          await pool.query(
            'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
            [sessionId, 'assistant', limitMessage]
          );
          return NextResponse.json({ message: limitMessage });
        }

        // Salvar objetivo
        const saveResult = await saveNLPOjective(
          pool,
          sessionId,
          pendingData.objective
        );

        if (!saveResult.success) {
          const errorMessage = coachStrings.objectiveSaveError(saveResult.error);

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
            ? coachStrings.objectiveSavedWithQuest(saveResult.title, questResult.title, questResult.milestones, questResult.xp_reward)
            : coachStrings.objectiveSavedQuestError(saveResult.title, questResult.title, memoryResult.error);
        } else {
          successMessage = memoryResult.success
            ? coachStrings.objectiveSavedNoQuest(saveResult.title, questResult.error)
            : coachStrings.objectiveSavedQuestError(saveResult.title, '', memoryResult.error);
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

        const cancelMessage = coachStrings.objectiveRejected(pendingData.objective.title);

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
        const questMessage = coachStrings.questCreated(questResult.title, questResult.milestones, questResult.xp_reward);
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', questMessage]
        );
        return NextResponse.json({ message: questMessage });
      }

      const errorMessage = coachStrings.questCreateError(questResult.error);
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
      persona,
      locale
    );

    // Corrigir resposta errada: se o LLM pediu "texto para reformular/reescrever", o usuário estava declarando objetivo OU respondendo à pergunta — nunca pedir isso
    if (llmResult.success && llmResult.response) {
      const responseAsksRephrase = /reformulasse|reescrevesse|rephrase|compartilhe o texto que|envie o texto que|send.*text.*rephrase|text you want me to rewrite|text you'd like me to rewrite|text you would like me to rewrite|provide the text you want|share the text you'd like|drop the text you want|forgot to share the text|manda o texto que você quer que eu reescreva|texto que você quer que eu reescreva/i.test(llmResult.response);
      if (responseAsksRephrase) {
        const trimmed = message.trim();
        const looksLikeGoal = /\b(quero|gostaria de|meu objetivo|desejo|pretendo|i want to|my goal is|i'd like to|i would like to)\b/i.test(trimmed);
        const looksLikeAnswer = /\b(vou ter que|tenho que|renunciar|deixar de|abrir mão|em (três|tres|\d+)\s*meses|preciso|i'll have to|i will have to|i have to|give up|sacrifice|in (three|\d+)\s*months|i need to|wake up earlier)\b/i.test(trimmed);
        if (looksLikeGoal) {
          const fallbackPt = `Ótimo! "${trimmed}" é um objetivo que vale a pena. Para trabalharmos isso como uma quest: em quanto tempo você imagina realizando isso? Tem alguma data em mente?`;
          const fallbackEn = `Great! "${trimmed}" is a goal worth pursuing. To work on this as a quest: how long do you imagine it taking? Do you have a timeline in mind?`;
          llmResult.response = locale === 'en-US' ? fallbackEn : fallbackPt;
          console.log('[NLP LLM] Resposta corrigida: LLM havia pedido reformulação; substituída por reconhecimento do objetivo.');
        } else if (looksLikeAnswer) {
          const fallbackPt = 'Entendi! Obrigado por compartilhar. Como você imagina lidar com esses desafios na sua rotina para seguir em frente com seu objetivo?';
          const fallbackEn = 'Got it! Thanks for sharing. How do you imagine handling these challenges in your routine to move forward with your goal?';
          llmResult.response = locale === 'en-US' ? fallbackEn : fallbackPt;
          console.log('[NLP LLM] Resposta corrigida: LLM havia pedido texto para reescrever; usuário estava respondendo à pergunta — substituída por reconhecimento e próxima pergunta.');
        } else {
          const fallbackPt = 'Entendi sua resposta. Para continuarmos: o que mais você gostaria de compartilhar sobre esse objetivo?';
          const fallbackEn = 'I understood your answer. To continue: what else would you like to share about this goal?';
          llmResult.response = locale === 'en-US' ? fallbackEn : fallbackPt;
          console.log('[NLP LLM] Resposta corrigida: LLM havia pedido texto para reescrever; substituída por reconhecimento genérico.');
        }
      }
    }

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
        // Load user profile for coach personalization (name, daily_work_hours, focus_area, context_for_coach)
        let userProfile = null;
        try {
          const profileCols = await pool.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name IN ('name', 'daily_work_hours', 'focus_area', 'context_for_coach')`
          );
          const cols = profileCols.rows.map((r) => r.column_name);
          if (cols.length > 0) {
            const selectCols = ['name', ...cols.filter((c) => c !== 'name')].join(', ');
            const userRow = await pool.query(`SELECT ${selectCols} FROM users WHERE id = $1`, [sessionId]);
            if (userRow.rows.length > 0) {
              const u = userRow.rows[0];
              const parts = [];
              if (u.name) parts.push(`Name: ${u.name}`);
              if (u.daily_work_hours != null) parts.push(`Daily work hours: ${u.daily_work_hours}`);
              if (u.focus_area) parts.push(`Focus area: ${u.focus_area}`);
              if (u.context_for_coach) parts.push(`Context: ${u.context_for_coach}`);
              if (parts.length > 0) userProfile = parts.join('\n');
            }
          }
        } catch (profileErr) {
          console.warn('[Chat] Could not load user profile:', profileErr.message);
        }

        // Converter histórico para formato esperado por getCoachResponse
        const messagesForOpenAI = history.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        messagesForOpenAI.push({ role: 'user', content: message });

        let coachResponse = await getCoachResponse(messagesForOpenAI, persona, locale, userProfile);

        // Corrigir se coach pediu "reformular" mas o usuário declarou um objetivo
        const looksLikeGoal = /\b(quero|gostaria de|meu objetivo|desejo|pretendo|i want to|my goal is|i'd like to)\b/i.test(message.trim());
        const responseAsksRephrase = /reformulasse|rephrase|envie o texto que|send.*text.*rephrase/i.test(coachResponse || '');
        if (looksLikeGoal && responseAsksRephrase) {
          coachResponse = locale === 'en-US'
            ? `Great! "${message.trim()}" is a goal worth pursuing. To work on this as a quest: how long do you imagine it taking? Do you have a timeline in mind?`
            : `Ótimo! "${message.trim()}" é um objetivo que vale a pena. Para trabalharmos isso como uma quest: em quanto tempo você imagina realizando isso? Tem alguma data em mente?`;
          console.log('[Chat] Resposta do coach corrigida: havia pedido reformulação.');
        }

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
    let fallbackMessage = await processWithoutOpenAI(message, history, pool, locale);

    // Tentar reescrever com persona se OpenAI estiver disponível
    if (hasOpenAI) {
      try {
        const rewritten = await rewriteWithPersona(fallbackMessage, persona, locale);
        if (rewritten && rewritten !== fallbackMessage) {
          console.log('[Chat] Fallback message rewritten with persona');
          fallbackMessage = rewritten;
        }
      } catch (rewriteError) {
        console.error('[Chat] Error rewriting fallback with persona:', rewriteError);
        // Continuar com mensagem original se reescrita falhar
      }
    }

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
 * Processamento sem OpenAI (fallback) — respostas localizadas
 */
async function processWithoutOpenAI(message, history, pool, locale = 'pt-BR') {
  const lowerMessage = message.toLowerCase().trim();

  const intentions = {
    greeting: ['oi', 'olá', 'ola', 'hey', 'hi', 'hello', 'bom dia', 'boa tarde', 'boa noite', 'good morning', 'good evening'],
    thanks: ['obrigado', 'valeu', 'thanks', 'thank you', 'agradeço'],
    help: ['ajuda', 'help', 'como funciona', 'funciona', 'como usar', 'how does it work'],
    goal: ['objetivo', 'meta', 'quero', 'pretendo', 'alcançar', 'goal', 'want to achieve']
  };

  let detectedIntention = null;
  for (const [intention, keywords] of Object.entries(intentions)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      detectedIntention = intention;
      break;
    }
  }

  const responses = locale === 'en-US'
    ? {
        greeting: 'Hello! 👋 I\'m the GoalsGuild Coach!\n\nI\'m here to help you achieve your goals. I can help you:\n\n🎯 Set objectives using NLP criteria\n⚔️ Create gamified quests\n📊 Track your progress\n🏆 Unlock achievements\n\nHow are you today? Feel free to tell me about your goals!',
        thanks: 'You\'re welcome! 😊 I\'m here to help!\n\nIs there anything else I can help you with?',
        help: 'Sure! Here\'s how it works:\n\n**🎯 Set Objectives**\nTell me about a goal and I\'ll ask you some questions to understand better.\n\n**⚔️ Quests**\nI can create quests (gamified journeys) from your objectives.\n\n**📊 Analytics**\nTrack your progress and see personalized insights.\n\nWhere would you like to start?',
        default: 'Got it! Tell me more.\n\nWhat are your goals? What do you want to achieve? I\'m here to help you create complete NLP objectives!'
      }
    : {
        greeting: 'Olá! 👋 Eu sou o GoalsGuild Coach!\n\nEstou aqui para ajudá-lo a alcançar seus objetivos. Posso ajudá-lo a:\n\n🎯 Definir objetivos usando os critérios NLP\n⚔️ Criar quests gamificadas\n📊 Acompanhar seu progresso\n🏆 Desbloquear achievements\n\nComo você está hoje? Sinta-se à vontade para me contar sobre seus objetivos!',
        thanks: 'Por nada! 😊 Estou aqui para ajudá-lo!\n\nTem mais alguma coisa em que posso ajudá-lo?',
        help: 'Claro! Vou te explicar como funciona:\n\n**🎯 Definir Objetivos**\nMe conte sobre um objetivo e eu vou te fazer algumas perguntas para entender melhor.\n\n**⚔️ Quests**\nPosso criar quests (jornadas gamificadas) a partir dos seus objetivos.\n\n**📊 Analytics**\nAcompanhe seu progresso e veja insights personalizados.\n\nPor onde você quer começar?',
        default: 'Entendi! Conte-me mais sobre isso.\n\nQuais são seus objetivos? O que você quer alcançar? Estou aqui para ajudá-lo a criar objetivos NLP completos!'
      };

  return responses[detectedIntention] || responses.default;
}
