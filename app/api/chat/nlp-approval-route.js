/**
 * Atualização da API do Chat para usar NLP Objective Saver
 * Sistema de aprovação de objetivos NLP completos
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { checkMessagePolicy } from '../../lib/guardrails';
import { checkAndApproveNLPObjective, approveAndSaveNLPOobjective } from '../../lib/nlp-objective-saver';
import { getUserFromToken } from '../../lib/auth';

/**
 * Armazena objetivos pendentes de aprovação por sessão
 */
const pendingObjectives = new Map();

/**
 * Verifica se mensagem é uma aprovação
 */
function isApprovalMessage(message) {
  const lower = message.toLowerCase().trim();
  const approvalPatterns = [
    /^sim$/i,
    /^só isso$/i,
    /^salvar$/i,
    /^pode salvar$/i,
    /^confirma$/i,
    /^confirmar$/i,
    /^salvar sim$/i
  ];

  return approvalPatterns.some(pattern => pattern.test(lower));
}

/**
 * Verifica se mensagem é uma rejeição
 */
function isRejectionMessage(message) {
  const lower = message.toLowerCase().trim();
  const rejectionPatterns = [
    /^não$/i,
    /^no$/i,
    /^cancelar$/i,
    /^não salvar$/i,
    /^nao$/i,
    /^nope$/i,
    /^esquece$/i
  ];

  return rejectionPatterns.some(pattern => pattern.test(lower));
}

/**
 * Verifica se mensagem é uma edição
 */
function isEditMessage(message) {
  const lower = message.toLowerCase().trim();
  const editPatterns = [
    /^editar$/i,
    /^modificar$/i,
    /^mudar$/i,
    /^alterar$/i
  ];

  return editPatterns.some(pattern => pattern.test(lower));
}

export async function POST(request) {
  // Verificar autenticação via JWT
  const user = getUserFromToken(request);

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid or missing token' }, { status: 401 });
  }

  // Usar userId como session_id para compatibilidade com schema
  const sessionId = user.userId;

  try {
    const { message, objectiveId, memory } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = getPool();

    // ====== GUARDRAILS: MODERAÇÃO ANTES DE PROCESSAR ======
    const moderation = checkMessagePolicy(message);

    if (!moderation.allowed) {
      // Mensagem bloqueada - responder com motivo
      const safeResponse = moderation.response || 'Desculpe, não posso ajudar com esse tipo de solicitação.';

      console.log('[GUARDRAILS] Blocked:', moderation.reason);

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

    // ====== VERIFICAR APROVAÇÃO DE OBJETIVO PENDENTE ======
    const pendingKey = `${sessionId}_pending`;

    if (pendingObjectives.has(pendingKey)) {
      const pendingData = pendingObjectives.get(pendingKey);

      console.log('[NLP] Verificando aprovação de objetivo pendente...');

      // Usuário aprovou?
      if (isApprovalMessage(message)) {
        console.log('[NLP] Objetivo APROVADO pelo usuário!');

        // Salvar objetivo e memória
        const result = await approveAndSaveNLPOobjective(
          pool,
          sessionId,
          pendingData.objective,
          pendingData.memory
        );

        // Remover objetivo pendente
        pendingObjectives.delete(pendingKey);

        // Salvar resposta do assistente
        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', result.message]
        );

        return NextResponse.json({ message: result.message });
      }

      // Usuário rejeitou?
      if (isRejectionMessage(message)) {
        console.log('[NLP] Objetivo REJEITADO pelo usuário');

        // Remover objetivo pendente
        pendingObjectives.delete(pendingKey);

        const cancelMessage = `Tudo bem! Não salvei o objetivo "${pendingData.objective.title}". Se quiser, podemos conversar mais sobre ele ou criar outro diferente.`;

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', cancelMessage]
        );

        return NextResponse.json({ message: cancelMessage });
      }

      // Usuário quer editar?
      if (isEditMessage(message)) {
        console.log('[NLP] Usuário quer EDITAR o objetivo');

        const editMessage = `Ótimo! O que você gostaria de mudar no objetivo "${pendingData.objective.title}"? Pode me dizer o que quer alterar (título, data alvo, algum critério NLP, etc).`;

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', editMessage]
        );

        return NextResponse.json({ message: editMessage });
      }

      // Se não for aprovação/rejeição/edição, remover o pendente e continuar processamento normal
      console.log('[NLP] Mensagem não é aprovação/rejeição/edição, removendo pendente...');
      pendingObjectives.delete(pendingKey);
    }
    // ====== FIM DA VERIFICAÇÃO DE APROVAÇÃO ======

    // Buscar histórico recente para contexto
    const historyResult = await pool.query(
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
      [sessionId]
    );

    const history = historyResult.rows.reverse();

    // ====== VERIFICAR SE DETECTOU OBJETIVO NLP ======
    console.log('[NLP] Verificando se detectou objetivo NLP completo...');

    const nlpCheck = await checkAndApproveNLPOobjective(pool, sessionId, message, history);

    if (nlpCheck.shouldSave && nlpCheck.needsApproval) {
      console.log('[NLP] Objetivo NLP completo detectado! Pedindo aprovação...');

      // Armazenar objetivo pendente de aprovação
      pendingObjectives.set(pendingKey, {
        objective: nlpCheck.objective,
        memory: nlpCheck.memory
      });

      // Salvar resposta do assistente (pedido de aprovação)
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', nlpCheck.message]
      );

      return NextResponse.json({
        message: nlpCheck.message,
        pendingApproval: true
      });
    }
    // ====== FIM DA DETECÇÃO DE OBJETIVO NLP ======

    // Processar mensagem normalmente (sem OpenAI - fallback inteligente)
    const assistantMessage = await processWithoutOpenAI(message, history, pool);

    // Salvar resposta do assistente
    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', assistantMessage]
    );

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

/**
 * Processa mensagem sem OpenAI (fallback inteligente com contexto)
 */
async function processWithoutOpenAI(message, history, pool) {
  const lowerMessage = message.toLowerCase().trim();

  // Buscar histórico para contexto
  const userMessages = history.filter(m => m.role === 'user');
  const messageCount = userMessages.length;

  // Estado da conversação
  let conversationState = 'greeting';
  let lastTopic = null;

  // Analisar histórico para determinar estado
  for (const msg of history) {
    if (msg.role === 'user') {
      const content = msg.content.toLowerCase();
      if (content.includes('objetivo') || content.includes('meta') || content.includes('quero')) {
        conversationState = 'discussing_goal';
      }
      if (content.includes('inglês') || content.includes('aprender')) {
        lastTopic = 'learning';
      }
      if (content.includes('correr') || content.includes('exercício')) {
        lastTopic = 'health';
      }
    }
  }

  console.log('Conversation state:', conversationState, 'Topic:', lastTopic, 'Messages:', messageCount);

  // Detectar intenção
  const intentions = {
    goal: ['objetivo', 'meta', 'quero', 'pretendo', 'alcançar', 'conquistar'],
    learning: ['aprender', 'estudar', 'curso', 'ler', 'inglês', 'programar'],
    health: ['correr', 'exercício', 'treino', 'emagrecer', 'perder peso', 'saudável'],
    productivity: ['produtivo', 'organizar', 'tarefas', 'foco', 'concentrar'],
    greeting: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite'],
    thanks: ['obrigado', 'valeu', 'thanks', 'agradeço'],
    help: ['ajuda', 'como funciona', 'funciona', 'como usar']
  };

  let detectedIntention = null;

  for (const [intention, keywords] of Object.entries(intentions)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      detectedIntention = intention;
      break;
    }
  }

  console.log('Detected intention:', detectedIntention);

  // Respostas contextuais baseadas na intenção
  const responses = {
    greeting: `Olá! 👋 Eu sou o GoalsGuild Coach!

Estou aqui para ajudá-lo a alcançar seus objetivos. Posso ajudá-lo a:

🎯 Definir objetivos usando os critérios NLP
⚔️ Criar quests e jornadas gamificadas
📊 Acompanhar seu progresso e analytics
🏆 Desbloquear achievements
✅ Fazer check-ins diários

Como você está hoje? Sinta-se à vontade para me contar sobre seus objetivos!`,

    thanks: `Por nada! 😊 Estou aqui para ajudá-lo a alcançar seus objetivos!

Tem mais alguma coisa em que posso ajudá-lo?`,

    help: `Claro! Vou te explicar como funciona:

**🎯 Definir Objetivos**
Me conte sobre um objetivo que você quer alcançar. Se você fornecer detalhes sobre:
- O que você QUER (positivo)
- Como você VÊ e SENTE ao alcançar
- Quando, onde e com quem
- Quais recursos você precisa
- Como vai SABER que alcançou

Eu vou criar um objetivo NLP completo para você!

**⚔️ Quests**
Posso criar quests (jornadas gamificadas) a partir dos seus objetivos, dividindo em milestones (etapas) que você completa para ganhar XP!

**📊 Analytics**
Acompanhe seu progresso, veja gráficos de produtividade e insights personalizados.

**🏆 Achievements**
Desbloqueie achievements ao completar quests, manter streaks de check-ins e muito mais!

**✅ Check-in Diário**
Faça check-ins diários para manter o momentum e ganhar XP!

Por onde você quer começar?`,

    default: `Entendi! Conte-me mais sobre isso. 

Quais são seus objetivos? O que você quer alcançar? Estou aqui para ajudá-lo a criar objetivos NLP completos, quests e acompanhar seu progresso!`
  };

  // Selecionar resposta baseado na intenção
  let response = responses.default;

  if (detectedIntention === 'greeting') {
    response = responses.greeting;
  } else if (detectedIntention === 'thanks') {
    response = responses.thanks;
  } else if (detectedIntention === 'help') {
    response = responses.help;
  } else if (detectedIntention === 'goal') {
    response = `Ótimo! Você está falando sobre um objetivo! 🎯

Para criar um objetivo NLP completo, me conte mais detalhes sobre:

✅ **O que você QUER** (formulado positivamente)
✅ **Como você VÊ, OUVE e SENTE** ao alcançar (sensório)
✅ **Por que é importante para você** (motivador)
✅ **Impacto em outras áreas** da sua vida (ecologia)
✅ **É algo sob seu controle?** (auto-iniciado)
✅ **Quando, onde, com quem?** (contexto)
✅ **Quais recursos precisa?** (tempo, dinheiro, ferramentas)
✅ **Como vai SABER que alcançou?** (evidência)

Quanto mais detalhes você me der, melhor será seu objetivo NLP!

Me conte mais sobre o que você quer alcançar!`;
  }

  return response;
}
