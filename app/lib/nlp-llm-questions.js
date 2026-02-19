/**
 * Sistema de Perguntas NLP via LLM
 * Usa OpenAI para fazer perguntas guiadas e extrair informações NLP
 */

import OpenAI from 'openai';
import { getThemePrompt } from './personas';
import { rewriteWithPersona } from './openai';

/**
 * Builds NLP questioning prompt with persona and locale (language of responses)
 */
function buildNLPQuestioningPrompt(persona = { tone: 'neutral', specialization: 'general', archetype: 'mentor', theme: null }, locale = 'pt-BR') {
  const isEnglish = locale === 'en-US';
  const languageRule = isEnglish
    ? '**CRITICAL — LANGUAGE:** You MUST respond ONLY in English. Every message to the user must be written entirely in English. Do not use Portuguese. Use the same structure (e.g. **Question:**, **NLP Objective Complete!**) but in English.'
    : '**CRÍTICO — IDIOMA:** Você DEVE responder SOMENTE em português (Brasil). Cada mensagem ao usuário deve ser escrita inteiramente em português.';

  const toneInstructions = {
    aggressive: 'Seja direto e desafiador. Pressione o usuário. Identifique desculpas.',
    gentle: 'Seja encorajador e solidário. Foque no progresso, não na perfeição.',
    neutral: 'Seja equilibrado e objetivo. Apresente fatos sem emoção forte.',
    sharp: 'Seja extremamente direto. Corte direto ao ponto. Sem rodeios.',
    warm: 'Seja conversacional e empático. Construa conexão primeiro.'
  };

  const specializationContext = {
    productivity: 'Foque em conclusão de tarefas, sistemas e execução.',
    fitness: 'Foque em objetivos físicos, consistência de treino e saúde.',
    career: 'Foque em crescimento profissional, habilidades e progressão de carreira.',
    general: 'Adapte-se a qualquer tópico que o usuário traga.'
  };

  const archetypeStyle = {
    mentor: 'Compartilhe sabedoria. Guie com experiência. Ensine princípios.',
    friend: 'Seja casual. Use humor. Mantenha leve mas real.',
    'drill-instructor': 'Exija resultados. Não aceite desculpas. Empurre através da resistência.',
    therapist: 'Explore padrões subjacentes. Faça perguntas reflexivas. Construa insights.'
  };

  // Se há um tema predefinido, usar o prompt temático
  const themePrompt = persona.theme ? getThemePrompt(persona.theme) : '';

  return `${languageRule}

---

Você é o **GoalsGuild Coach**, um assistente especializado em ajudar usuários a definir objetivos NLP (Programação Neurolinguística) completos e bem-formados.

${themePrompt ? `**Seu Personagem:**\n${themePrompt}\n\n` : ''}**Sua Personalidade:**
**Tom:** ${toneInstructions[persona.tone] || toneInstructions.neutral}
**Especialização:** ${specializationContext[persona.specialization] || specializationContext.general}
**Arquétipo:** ${archetypeStyle[persona.archetype] || archetypeStyle.mentor}

## SEU PAPEL:

Sua missão é ajudar o usuário a criar objetivos usando os 8 critérios NLP. Você deve fazer perguntas naturais e conversacionais para coletar as informações faltantes.

## OS 8 CRITÉRIOS NLP:

1. **Positivo** - O que a pessoa QUER (formulado positivamente)
   - Ex: "Quero aprender inglês" (não "Não quero ficar estagnado")

2. **Sensório** - O que a pessoa VÊ, OUVE e SENTE ao alcançar
   - Ex: "Me vejo falando fluentemente", "Sinto confiança", "Ouço-me pronunciando bem"

3. **Motivador** - Por que é empolgante para a pessoa
   - Ex: "Me sinto livre", "Estou animado", "Muda minha vida"

4. **Ecologia** - OBRIGATÓRIO obter DUAS informações:
   a) O que a pessoa terá que DEIXAR DE FAZER ou RENUNCIAR para se comprometer com o objetivo
   b) COMO resolverá essas fricções (conflitos entre o objetivo e outras áreas da vida)
   - Não use perguntas prontas. Formule perguntas naturais e contextuais.
   - Ex de renúncia: "Vou ter que reduzir tempo nas redes sociais", "Preciso abrir mão de saídas aos sábados"
   - Ex de resolução: "Vou treinar de madrugada antes da família acordar", "Combinarei com minha esposa os dias fixos"

5. **Auto-iniciado** - Sob controle da pessoa (o que ela vai fazer)
   - Ex: "Vou estudar 1h por dia", "Estou comprometido"

6. **Contexto** - Quando, onde, com quem
   - Ex: "Todos os dias às 19h, em casa, sozinho"

7. **Recursos** - O que precisa (tempo, dinheiro, ferramentas)
   - Ex: "Preciso de aplicativos, livros, 1h por dia"

8. **Evidência** - Como saber que alcançou (evidência concreta)
   - Ex: "Quando puder ler livro sem tradutor"

9. **Data de conclusão** - OBRIGATÓRIO antes de salvar
   - Pergunte quando a pessoa pretende alcançar o objetivo
   - Se achar o prazo IRREALISTA (muito curto ou muito longo para o contexto), sugira um prazo ideal e explique por quê
   - Formule perguntas naturais, não use perguntas prontas

## COMO FUNCIONA:

1. **Analise a mensagem do usuário** e identifique quais critérios NLP estão presentes
2. **Se faltarem critérios**, faça UMA pergunta natural e conversacional (nunca use perguntas prontas ou formulário)
3. **Só quando tiver todos os 9 itens** (8 critérios + data de conclusão), resuma o objetivo completo e peça aprovação

## PRIORIDADE DAS PERGUNTAS:

Se faltarem múltiplos critérios, pergunte nesta ordem:
1. Positivo (o que QUER)
2. Sensório (VÊ, OUVE, SENTE)
3. Contexto (quando, onde, com quem)
4. Recursos (o que precisa)
5. Evidência (como saber que alcançou)
6. Motivador (por que é empolgante)
7. Ecologia (o que renunciará + como resolverá fricções - duas perguntas)
8. Auto-iniciado (sob seu controle)
9. Data de conclusão (quando pretende alcançar - sugerir prazo se irreal)

## EXEMPLO DE CONVERSA (Ecologia e Data):

**Usuário:** "Quero correr 5 km. Vou ter mais energia para a família."

**Coach:** "Ótimo! Para se comprometer com os treinos, o que você terá que deixar de fazer ou abrir mão? Alguma atividade que vai precisar reduzir?"

**Usuário:** "Vou ter que reduzir o tempo nas redes sociais e talvez algumas saídas aos sábados."

**Coach:** "Entendo. E como você pretende resolver isso? Como vai equilibrar os treinos com a família e o lazer?"

**Usuário:** "Vou treinar de manhã cedo antes de todo mundo acordar, e combinar com minha esposa os dias fixos."

**Coach:** "Perfeito! E quando você pretende estar correndo os 5 km? Tem alguma data em mente?"

**Usuário:** "Em 2 semanas."

**Coach:** "Dois semanas pode ser bem intenso para quem está começando. Que tal pensarmos em 6 a 8 semanas? Dá tempo de evoluir sem risco de lesão. O que acha?"

## REGRAS IMPORTANTES:

✅ Sempre faça UMA pergunta por vez
✅ NUNCA use perguntas prontas ou de formulário - formule cada pergunta de forma natural e contextual
✅ Seja natural e conversacional (não robótico)
✅ Adapte a pergunta ao contexto da conversa e ao que o usuário já disse
✅ Seja específico e direto
✅ Seja encorajador e positivo
❌ Não faça múltiplas perguntas de uma vez
❌ Não seja repetitivo
❌ Não pareça um formulário
❌ Não use listas de perguntas fixas

## FORMATO DE RESPOSTA:

Se faltar critérios, responda assim:

**🤔 Pergunta:** [sua pergunta aqui - formule de forma natural, nunca use pergunta pronta]

[Já identificado: X/9 itens - 8 critérios NLP + data de conclusão]
[Positivo: xxx]
[Sensório: xxx]
...

Se tiver todos os 9 itens (8 critérios + data de conclusão), responda assim:

**🎯 Objetivo NLP Completo!**

**Título:** [título do objetivo]

**Declaração:** [declaração completa]

**Critérios NLP (8/8):**
✅ **Positivo:** [critério]
✅ **Sensório:** [critério]
✅ **Motivador:** [critério]
✅ **Ecologia:** [o que renunciará + como resolverá fricções]
✅ **Auto-iniciado:** [critério]
✅ **Contexto:** [critério]
✅ **Recursos:** [critério]
✅ **Evidência:** [critério]

**Data de conclusão:** [data no formato YYYY-MM-DD ou descrição clara]

---

**Deseja salvar este objetivo e sua memória?**`;
}

/**
 * Histórico da conversa para contexto
 */
let conversationHistory = [];

/**
 * Analisa mensagem e faz pergunta NLP via LLM
 */
export async function askNLPQuestionViaLLM(userMessage, history = [], persona = { tone: 'neutral', specialization: 'general', archetype: 'mentor' }, locale = 'pt-BR') {
  // Verificar se tem OpenAI API key
  const hasOpenAI = !!process.env.OPENAI_API_KEY &&
                    process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
                    process.env.OPENAI_API_KEY.length > 20;

  if (!hasOpenAI) {
    console.log('[NLP LLM] No OpenAI API key, using fallback');
    return null;
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Construir histórico de mensagens
    const messages = [
      {
        role: 'system',
        content: buildNLPQuestioningPrompt(persona, locale)
      },
      ...history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: userMessage
      }
    ];

    console.log('[NLP LLM] Sending request to OpenAI...');

    // Ajustar temperatura baseado na personalidade
    let temperature = 0.7;
    if (persona.tone === 'warm' || persona.tone === 'gentle') {
      temperature = 0.8;
    } else if (persona.tone === 'aggressive' || persona.tone === 'sharp') {
      temperature = 0.6;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: temperature,
      max_tokens: 500
    });

    let response = completion.choices[0].message.content;
    console.log('[NLP LLM] Response received:', response.substring(0, 100));

    // Reescrever usando a persona para garantir que siga o tom e estilo
    try {
      const rewritten = await rewriteWithPersona(response, persona, locale);
      if (rewritten && rewritten !== response) {
        console.log('[NLP LLM] Response rewritten with persona');
        response = rewritten;
      }
    } catch (rewriteError) {
      console.error('[NLP LLM] Error rewriting with persona:', rewriteError);
      // Continuar com resposta original se reescrita falhar
    }

    return response;

  } catch (error) {
    console.error('[NLP LLM] Error:', error);
    return null;
  }
}

/**
 * Extrai critérios NLP da resposta do LLM
 */
export function extractNLPFromLLMResponse(llmResponse) {
  if (!llmResponse) {
    return null;
  }

  // Verificar se é um objetivo completo (PT ou EN)
  const isComplete = llmResponse.includes('🎯 Objetivo NLP Completo!') ||
                   llmResponse.includes('Critérios NLP (8/8)') ||
                   llmResponse.includes('NLP Objective Complete!') ||
                   llmResponse.includes('NLP Criteria (8/8)') ||
                   /objective complete|objetivo completo/i.test(llmResponse);

  if (isComplete) {
    return {
      complete: true,
      response: llmResponse,
      objective: parseNLPObjective(llmResponse)
    };
  }

  // Se não é completo, é uma pergunta
  return {
    complete: false,
    response: llmResponse
  };
}

/**
 * Converte string de data para YYYY-MM-DD (PostgreSQL DATE).
 * Suporta: YYYY-MM-DD, DD/MM/YYYY, "em X semanas", "em X meses"
 */
function parseTargetDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const s = dateStr.trim().toLowerCase();

  // Já está em formato ISO
  const isoMatch = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return dateStr;

  // DD/MM/YYYY
  const brMatch = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (brMatch) {
    return `${brMatch[3]}-${brMatch[2].padStart(2, '0')}-${brMatch[1].padStart(2, '0')}`;
  }

  // "em X semanas", "X semanas" ou "em X semana"
  const semanasMatch = s.match(/(?:em\s+)?(\d+)\s+semana[s]?/);
  if (semanasMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(semanasMatch[1], 10) * 7);
    return d.toISOString().split('T')[0];
  }

  // "em X meses", "X meses" ou "em X mês"
  const mesesMatch = s.match(/(?:em\s+)?(\d+)\s+mes(?:es)?/);
  if (mesesMatch) {
    const d = new Date();
    d.setMonth(d.getMonth() + parseInt(mesesMatch[1], 10));
    return d.toISOString().split('T')[0];
  }

  // "in X weeks", "X weeks"
  const weeksEnMatch = s.match(/(?:in\s+)?(\d+)\s+week[s]?/);
  if (weeksEnMatch) {
    const d = new Date();
    d.setDate(d.getDate() + parseInt(weeksEnMatch[1], 10) * 7);
    return d.toISOString().split('T')[0];
  }

  // "in X months", "X months"
  const monthsEnMatch = s.match(/(?:in\s+)?(\d+)\s+month[s]?/);
  if (monthsEnMatch) {
    const d = new Date();
    d.setMonth(d.getMonth() + parseInt(monthsEnMatch[1], 10));
    return d.toISOString().split('T')[0];
  }

  // Formato não reconhecido - retornar null para evitar erro no banco
  return null;
}

/**
 * Faz parse do objetivo NLP da resposta do LLM
 */
function parseNLPObjective(response) {
  const objective = {
    is_nlp_complete: true
  };

  // Extrair critérios usando regex (PT e EN)
  const criteria = [
    { key: 'nlp_criteria_positive', patterns: [/\*\*Positivo:\*\*\s*([^\n]+)/, /\*\*Positive:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_sensory', patterns: [/\*\*Sensório:\*\*\s*([^\n]+)/, /\*\*Sensory:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_compelling', patterns: [/\*\*Motivador:\*\*\s*([^\n]+)/, /\*\*Compelling:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_ecology', patterns: [/\*\*Ecologia:\*\*\s*([^\n]+)/, /\*\*Ecology:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_self_initiated', patterns: [/\*\*Auto-iniciado:\*\*\s*([^\n]+)/, /\*\*Self-initiated:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_context', patterns: [/\*\*Contexto:\*\*\s*([^\n]+)/, /\*\*Context:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_resources', patterns: [/\*\*Recursos:\*\*\s*([^\n]+)/, /\*\*Resources:\*\*\s*([^\n]+)/] },
    { key: 'nlp_criteria_evidence', patterns: [/\*\*Evidência:\*\*\s*([^\n]+)/, /\*\*Evidence:\*\*\s*([^\n]+)/] }
  ];

  for (const { key, patterns } of criteria) {
    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match && match[1]) {
        objective[key] = match[1].trim();
        break;
      }
    }
  }

  // Extrair título (PT ou EN)
  const titleMatch = response.match(/\*\*Título:\*\*\s*([^\n]+)/) || response.match(/\*\*Title:\*\*\s*([^\n]+)/);
  if (titleMatch && titleMatch[1]) {
    objective.title = titleMatch[1].trim();
  }

  // Extrair declaração (PT ou EN)
  const statementMatch = response.match(/\*\*Declaração:\*\*\s*([^\n*]+)/) || response.match(/\*\*Statement:\*\*\s*([^\n*]+)/);
  if (statementMatch && statementMatch[1]) {
    objective.statement = statementMatch[1].trim();
  }

  // Extrair data de conclusão (PT ou EN)
  const targetMatch = response.match(/\*\*Data de conclusão:\*\*\s*([^\n]+)/) || response.match(/\*\*Completion date:\*\*\s*([^\n]+)/) || response.match(/\*\*Target date:\*\*\s*([^\n]+)/);
  if (targetMatch && targetMatch[1]) {
    const dateStr = targetMatch[1].trim();
    objective.target_date = parseTargetDate(dateStr);
  }

  return objective;
}

/**
 * Sistema de perguntas NLP via LLM
 */
export class NLPQuestionLLM {
  constructor() {
    this.sessions = new Map(); // sessionId -> { history, startTime }
  }

  startSession(sessionId) {
    this.sessions.set(sessionId, {
      history: [],
      startTime: Date.now()
    });
  }

  hasActiveSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  async askQuestion(sessionId, userMessage, dbHistory = [], persona = { tone: 'neutral', specialization: 'general', archetype: 'mentor' }, locale = 'pt-BR') {
    const session = this.sessions.get(sessionId);

    if (!session) {
      this.startSession(sessionId);
    }

    const updatedSession = this.sessions.get(sessionId);

    // Adicionar mensagem do usuário ao histórico
    updatedSession.history.push({
      role: 'user',
      content: userMessage
    });

    // Fazer pergunta via LLM (locale = idioma da resposta)
    const llmResponse = await askNLPQuestionViaLLM(
      userMessage,
      [...dbHistory, ...updatedSession.history],
      persona,
      locale
    );

    if (!llmResponse) {
      return {
        success: false,
        error: 'LLM not available'
      };
    }

    // Adicionar resposta do assistente ao histórico
    updatedSession.history.push({
      role: 'assistant',
      content: llmResponse
    });

    // Extrair informações da resposta
    const nlpData = extractNLPFromLLMResponse(llmResponse);

    if (nlpData.complete) {
      // Objetivo NLP completo detectado
      this.endSession(sessionId);

      return {
        success: true,
        complete: true,
        objective: nlpData.objective,
        response: llmResponse
      };
    }

    // Ainda coletando informações
    return {
      success: true,
      complete: false,
      response: llmResponse
    };
  }

  endSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  getSessionHistory(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.history : [];
  }
}

// Instância singleton
const nlpQuestionLLM = new NLPQuestionLLM();

export default nlpQuestionLLM;
