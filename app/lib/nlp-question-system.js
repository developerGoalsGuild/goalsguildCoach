/**
 * Sistema de Perguntas Guiadas NLP
 * Coleta informações faltantes através de perguntas
 */

/**
 * Mapeamento de perguntas para cada critério NLP
 */
const NLP_QUESTIONS = {
  positive: {
    question: "O que você QUER alcançar? (formule de forma positiva)",
    examples: [
      "Quero aprender inglês",
      "Pretendo me exercitar 3x por semana",
      "Almejo conseguir uma promoção"
    ],
    patterns: [
      /quero|pretendo|almejo|desejo|alvo/i
    ]
  },

  sensory: {
    question: "Como você VÊ, OUVE e SENTE ao alcançar isso?",
    examples: [
      "Me vejo falando fluentemente com estrangeiros",
      "Sinto minhas roupas mais folgadas",
      "Ouço meus colegas parabenizando meu trabalho"
    ],
    patterns: [
      /vejo|sinto|ouço|visualizo|imagino|percebo/i
    ]
  },

  compelling: {
    question: "Por que isso é MOTIVADOR para você? O que te empolga?",
    examples: [
      "Me sinto livre e confiante",
      "Estou muito animado com essa conquista",
      "Isso vai mudar minha vida para melhor"
    ],
    patterns: [
      /motiv|empolg|excita|apaixon|energi|entusias/i
    ]
  },

  ecology: {
    question: "Qual o IMPACTO positivo em outras áreas da sua vida?",
    examples: [
      "Melhorará minha carreira e renda",
      "Vou ter mais energia para brincar com meus filhos",
      "Minha saúde vai melhorar muito"
    ],
    patterns: [
      /impacto|vida|área|família|trabalho|saúde|melhor|ajuda|benefici/i
    ]
  },

  self_initiated: {
    question: "Isso é algo SOB SEU CONTROLE? O que você vai fazer?",
    examples: [
      "Vou estudar 1 hora por dia",
      "Estou comprometido a fazer exercícios",
      "Vou dedicar tempo focado nisso"
    ],
    patterns: [
      /vou|estou|posso|quero|decid|planej|compromet|dedico/i
    ]
  },

  context: {
    question: "QUANDO, ONDE e COM QUEM você vai fazer isso?",
    examples: [
      "Todos os dias às 19h, em casa, sozinho",
      "3x por semana na academia, pela manhã",
      "Nos finais de semana, no meu escritório"
    ],
    patterns: [
      /quando|onde|com quem|tempo|lugar|dias|semanas|meses|anos|em|casa|trabalho/i
    ]
  },

  resources: {
    question: "Quais RECURSOS você precisa? (tempo, dinheiro, ferramentas, ajuda)",
    examples: [
      "Preciso de 1h por dia e um aplicativo de idiomas",
      "Vou usar livros, vídeos online e cursos",
      "Preciso de uma academia e tênis de corrida"
    ],
    patterns: [
      /preciso|necessito|tenho|recurs|ferramenta|vou usar|precisar|i/i
    ]
  },

  evidence: {
    question: "Como você vai SABER que alcançou? Qual a EVIDÊNCIA?",
    examples: [
      "Quando puder ler um livro em inglês sem tradutor",
      "Quando minhas roupas estiverem folgadas",
      "Quando eu receber a promoção"
    ],
    patterns: [
      /saber|evidênc|sinal|indica|percebei|quando|alcan|conseguir|ter|ser/i
    ]
  }
};

/**
 * Analisa uma mensagem e retorna os critérios NLP encontrados
 */
export function analyzeNLPCriteria(message) {
  const found = {};
  const missing = {};

  for (const [criteria, config] of Object.entries(NLP_QUESTIONS)) {
    const hasCriteria = config.patterns.some(pattern => pattern.test(message));

    if (hasCriteria) {
      found[criteria] = true;
    } else {
      missing[criteria] = config;
    }
  }

  return {
    found: Object.keys(found),
    missing: Object.keys(missing),
    allFound: Object.keys(missing).length === 0,
    criteriaCount: Object.keys(found).length
  };
}

/**
 * Gera a próxima pergunta baseada nos critérios faltantes
 */
export function generateNextQuestion(missingCriteria, conversationContext) {
  // Priorizar critérios mais importantes
  const priority = ['positive', 'sensory', 'context', 'resources', 'evidence'];

  for (const criteria of priority) {
    if (missingCriteria.includes(criteria)) {
      const config = NLP_QUESTIONS[criteria];
      return {
        criteria,
        question: config.question,
        examples: config.examples
      };
    }
  }

  // Se não for critério prioritário, pegar qualquer um
  const criteria = missingCriteria[0];
  const config = NLP_QUESTIONS[criteria];

  return {
    criteria,
    question: config.question,
    examples: config.examples
  };
}

/**
 * Verifica se deve fazer perguntas NLP
 */
export function shouldAskNLQuestions(message, conversationHistory) {
  // Verificar se usuário está falando sobre um objetivo
  const goalKeywords = ['quero', 'pretendo', 'almejo', 'desejo', 'meu objetivo'];
  const hasGoalKeyword = goalKeywords.some(kw => 
    message.toLowerCase().includes(kw)
  );

  if (!hasGoalKeyword) {
    return { shouldAsk: false };
  }

  // Analisar critérios encontrados
  const analysis = analyzeNLPCriteria(message);

  // Se tiver menos de 6 critérios, fazer perguntas
  if (analysis.criteriaCount < 6) {
    const nextQuestion = generateNextQuestion(analysis.missing, conversationHistory);

    return {
      shouldAsk: true,
      criteria: analysis.found,
      missing: analysis.missing,
      nextQuestion
    };
  }

  return { shouldAsk: false };
}

/**
 * Gera mensagem de pergunta NLP
 */
export function generateNLQuestionMessage(nextQuestion, userMessage) {
  const { criteria, question, examples } = nextQuestion;

  return `
🤔 **Deixa eu te fazer uma pergunta para entender melhor seu objetivo:**

${question}

**Exemplos:**
${examples.map(ex => `• "${ex}"`).join('\n')}

${userMessage ? `\n(Sua mensagem anterior: "${userMessage}")` : ''}
  `.trim();
}

/**
 * Coleta informações de um critério específico
 */
export function collectCriteria(userMessage, criteria) {
  const config = NLP_QUESTIONS[criteria];

  if (!config) {
    return null;
  }

  // Verificar se mensagem contém informação para o critério
  const hasInfo = config.patterns.some(pattern => pattern.test(userMessage));

  if (hasInfo) {
    return {
      criteria,
      value: userMessage,
      found: true
    };
  }

  return {
    criteria,
    value: null,
    found: false
  };
}

/**
 * Verifica se a mensagem responde a uma pergunta pendente
 */
export function isAnsweringQuestion(message, pendingQuestion) {
  if (!pendingQuestion) {
    return false;
  }

  const { criteria } = pendingQuestion;
  const collected = collectCriteria(message, criteria);

  return collected.found;
}

/**
 * Constrói objetivo NLP completo a partir das respostas
 */
export function buildNLPOjectiveFromAnswers(answers, originalMessage) {
  const objective = {
    statement: originalMessage,
    is_nlp_complete: true
  };

  // Mapear respostas para critérios
  for (const [criteria, value] of Object.entries(answers)) {
    switch (criteria) {
      case 'positive':
        objective.nlp_criteria_positive = value;
        objective.title = value;
        break;
      case 'sensory':
        objective.nlp_criteria_sensory = value;
        break;
      case 'compelling':
        objective.nlp_criteria_compelling = value;
        break;
      case 'ecology':
        objective.nlp_criteria_ecology = value;
        break;
      case 'self_initiated':
        objective.nlp_criteria_self_initiated = value;
        break;
      case 'context':
        objective.nlp_criteria_context = value;
        break;
      case 'resources':
        objective.nlp_criteria_resources = value;
        break;
      case 'evidence':
        objective.nlp_criteria_evidence = value;
        break;
    }
  }

  return objective;
}

/**
 * Sistema de perguntas guiadas
 */
export class NLPQuestionSystem {
  constructor() {
    this.sessions = new Map(); // sessionId -> { answers, currentQuestion, originalMessage }
  }

  startSession(sessionId, originalMessage) {
    this.sessions.set(sessionId, {
      answers: {},
      currentQuestion: null,
      originalMessage,
      completed: false
    });
  }

  hasActiveSession(sessionId) {
    return this.sessions.has(sessionId);
  }

  getCurrentQuestion(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.currentQuestion : null;
  }

  addAnswer(sessionId, criteria, answer) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.answers[criteria] = answer;
    }
  }

  getNextQuestion(sessionId, userMessage) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // Analisar mensagem atual
    const analysis = analyzeNLPCriteria(userMessage);

    // Verificar quais critérios ainda faltam
    const answeredCriteria = Object.keys(session.answers);
    const allCriteria = Object.keys(NLP_QUESTIONS);
    const missingCriteria = allCriteria.filter(c => !answeredCriteria.includes(c));

    if (missingCriteria.length === 0) {
      session.completed = true;
      return null;
    }

    // Verificar se a mensagem atual responde à pergunta atual
    if (session.currentQuestion) {
      const answered = isAnsweringQuestion(userMessage, session.currentQuestion);

      if (answered) {
        // Salvar resposta
        this.addAnswer(sessionId, session.currentQuestion.criteria, userMessage);
      }
    }

    // Gerar próxima pergunta
    const nextQuestion = generateNextQuestion(missingCriteria, {});
    session.currentQuestion = nextQuestion;

    return nextQuestion;
  }

  isComplete(sessionId) {
    const session = this.sessions.get(sessionId);
    return session && session.completed;
  }

  buildObjective(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session || !session.completed) {
      return null;
    }

    return buildNLPOjectiveFromAnswers(session.answers, session.originalMessage);
  }

  endSession(sessionId) {
    this.sessions.delete(sessionId);
  }

  getProgress(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const total = Object.keys(NLP_QUESTIONS).length;
    const answered = Object.keys(session.answers).length;

    return {
      answered,
      total,
      percentage: Math.round((answered / total) * 100)
    };
  }
}

// Instância singleton
const nlpQuestionSystem = new NLPQuestionSystem();

export default nlpQuestionSystem;
