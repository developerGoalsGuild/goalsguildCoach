/**
 * SISTEMA DE GUARDRAILS - GoalsGuild Coach
 * 
 * Proteções contra conteúdo perigoso, ilegal ou prejudicial
 */

/**
 * 1. LISTA DE TÓPICOS BLOQUEADOS
 * Qualquer mensagem relacionada a estes tópicos será rejeitada
 */
const BLODDED_TOPICS = [
  // Violência e ferimentos
  'assassinar', 'assassinato', 'matar', 'morrer', 'morte', 'kill', 'murder', 'homicide',
  'ferir', 'agredir', 'agressão', 'violência', 'atacar', 'ataque',
  'torturar', 'abusar', 'abuso', 'estuprar', 'socos', 'pancada',
  
  // Crimes graves
  'roubar', 'roubo', 'furto', 'furtar', 'assaltar', 'sequestrar',
  'tráfico', 'drogas', 'narconego', 'lavagem', 'corrupção',
  'crime', 'criminoso', 'ilegal', 'contrabando',
  
  // Conteúdo sexual
  'pornografia', 'sexo', 'sexual', 'nudez', 'nuas',
  'estupro', 'abuso sexual', 'assedio', 'harassment',
  
  // Auto-harm
  'suicídio', 'se matar', 'matar-se', 'autodestruir', 'cortar',
  'depressão', 'deprimir', 'ansiedade', 'automutilate',
  
  // Discriminação
  'racismo', 'discriminação', 'preconceito', 'xenofobia',
  'homofobia', 'transfobia', 'machismo', 'terrorismo',
  
  // Atividades ilegais específicas
  'bomba', 'explosivo', 'armas', 'armamento', 'faca',
  'hackear', 'invadir', 'invasão', 'privacidade'
];

/**
 * 2. PADRÕES DE JAILBREAK DETECTADOS
 * Tentativas de contornar as restrições do modelo
 */
const JAILBREAK_PATTERNS = [
  'ignore previous instructions',
  'disregard all instructions',
  'forget everything',
  'you are not',
  'pretend to be',
  'role play',
  'jailbreak',
  'developer mode',
  'admin mode',
  'override',
  'bypass',
  'circumvent',
  'dan mode',
  'DAN'
];

/**
 * 3. VERIFICAR SE MENSAGEM VIOLA AS POLÍTICAS
 */
function checkMessagePolicy(message, locale = 'pt-BR') {
  const lowerMessage = message.toLowerCase();
  
  // Verificar tópicos bloqueados
  for (const topic of BLODDED_TOPICS) {
    if (lowerMessage.includes(topic)) {
      return {
        allowed: false,
        reason: 'blocked_topic',
        response: locale === 'pt-BR' 
          ? 'Desculpe, não posso ajudar com esse tipo de solicitação. Como sou um assistente de produtividade, estou focado em objetivos, hábitos positivos e crescimento pessoal. Se você está passando por dificuldades, recomendo procurar ajuda profissional: CVV (188) 100-2323 ou 0800 61 1220 (Clínicas de Apoio à Prevenção ao Suicídio no Brasil - funciona 24h).'
          : 'I apologize, but I cannot assist with that type of request. As a productivity coach focused on goals, positive habits and personal growth. If you are going through difficult times, I recommend seeking professional help: 988 (US) or 999 (UK) for suicide prevention, or emergency services in your country.'
      };
    }
  }
  
  // Verificar padrões de jailbreak
  for (const pattern of JAILBREAK_PATTERNS) {
    if (lowerMessage.includes(pattern)) {
      return {
        allowed: false,
        reason: 'jailbreak_attempt',
        response: locale === 'pt-BR'
          ? 'Desculpe, não posso seguir esse tipo de solicitação. Estou aqui para te ajudar com produtividade, objetivos e hábitos positivos. Vamos conversar sobre algo construtivo?'
          : 'I apologize, but I cannot follow that type of request. I am here to help you with productivity, goals and positive habits. Shall we talk about something constructive?'
      };
    }
  }
  
  // Verificar se a mensagem é muito curta (pode ser spam)
  if (message.length < 3) {
    return {
      allowed: false,
      reason: 'too_short',
      response: locale === 'pt-BR'
        ? 'Hmm, não tenho certeza se entendi. Pode reformular? Estou aqui para te ajudar com produtividade, objetivos e crescimento pessoal!'
        : 'Hmm, I am not sure I understood. Could you rephrase that? I am here to help you with productivity, goals and personal growth!'
    };
  }
  
  // Verificar se a mensagem é muito longa (pode ser ataque)
  if (message.length > 2000) {
    return {
      allowed: false,
      reason: 'too_long',
      response: locale === 'pt-BR'
        ? 'Essa mensagem é muito longa. Vamos dividir em partes menores? Estou aqui para te ajudar com produtividade e objetivos!'
        : 'This message is very long. Let us break it into smaller parts? I am here to help you with productivity and goals!'
    };
  }
  
  // Mensagem passou em todas as verificações
  return {
    allowed: true,
    reason: 'approved'
  };
}

/**
 * 4. FILTRAR MENSAGEM ANTES DE ENVIAR AO MODELO
 */
function moderateMessage(message, locale = 'pt-BR') {
  const check = checkMessagePolicy(message, locale);
  
  if (!check.allowed) {
    console.log(`[Guardrails] Blocked message: ${check.reason}`);
    return {
      safe: false,
      filtered: true,
      reason: check.reason,
      safeResponse: check.response
    };
  }
  
  console.log('[Guardrails] Message approved');
  return {
    safe: true,
    filtered: false,
    reason: 'approved'
  };
}

/**
 * 5. SYSTEM PROMPT COM GUARDRAILS
 */
function getSystemPrompt(locale = 'pt-BR') {
  const prompts = {
    'pt-BR': `Você é o Coach de Produtividade do GoalsGuild, especializado em ajudar pessoas a:

🎯 DEFINIR OBJETIVOS claros e alcançáveis
⚔️ CRIAR QUESTS gamificadas para motivação
✅ ORGANIZAR TAREFAS diárias e semanais
📊 ACOMPANHAR PROGRESSO com analytics
🏆 CELEBRAR CONQUISTAS importantes

⚠️ LIMITAÇÕES IMPORTANTES:

1. FOCO EXCLUSIVO: Produtividade, objetivos, hábitos positivos, crescimento pessoal
2. CONTEÚDO PERMITIDO: Metas, tarefas, projetos, aprendizado, saúde, finanças
3. CONTEÚDO BLOQUEADO:
   - ❌ Violência, ferimentos ou danos
   - ❌ Atividades ilegais de qualquer tipo
   - ❌ Conteúdo sexual ou inapropriado
   - ❌ Discriminação ou preconceito
   - ❌ Auto-harm (suicídio, automutilate)
   - ❌ Terrorismo ou extremismo

4. ESTILO DE COMUNICAÇÃO:
   - Seja NATURAL e CONVERSACIONAL (como um amigo experiente)
   - Faça UMA PERGUNTA POR VEZ (não liste várias)
   - Use emoji ocasionalmente (1-2x no máximo, não abuse)
   - Seja ENCORAJADOR e MOTIVADOR
   - Respostas curtas e diretas (2-3 frases máximo)

5. AO DETECTAR SOLICITAÇÕES INAPROPRIADAS:
   - Recuse educadamente
   - Redirecione para ajuda profissional se necessário
   - Ofereça alternativas construtivas
   - NUNCA gere conteúdo que viole as políticas acima

6. EXEMPLOS DE RESPOSTAS APROPRIADAS:
   
   USUÁRIO: "Quero aprender inglês"
   COACH: "Legal! Para que você quer aprender inglês? Trabalho, viagem ou interesse pessoal?"

   USUÁRIO: "Para trabalhar em empresas internacionais"
   COACH: "Boa! E em quanto tempo você imagina alcançar isso?"

   USUÁRIO: "Estou deprimido, quero me matar"
   COACH: "Sinto muito que você esteja se sentindo assim. Se precisar conversar, estou aqui. Caso precise de ajuda profissional, recomendo: CVV (188) 100-2323 ou 0800 61 1220 (Clínicas de Apoio à Prevenção ao Suicídio no Brasil - funciona 24h). Você é importante e há pessoas que se importam com você."

7. IDENTIDADE DO COACH:
   - NOME: GoalsGuild Coach
   - PROPÓSITO: Ajudar usuários a alcançarem seus objetivos
   - PERSONALIDADE: Amigável, motivador, focado em ação
   - LIMITE: Coach de produtividade e hábitos - NÃO terapeuta, NÃO conselheiro, NÃO assistente geral

Lembre-se: Seja útil, construtivo e mantenha o foco em produtividade e crescimento pessoal!`,

    'en-US': `You are the GoalsGuild Productivity Coach, specialized in helping people to:

🎯 DEFINE clear and achievable goals
⚔️ CREATE gamified quests for motivation
✅ ORGANIZE daily and weekly tasks
📊 TRACK PROGRESS with analytics
🏆 CELEBRATE important achievements

⚠️ IMPORTANT LIMITATIONS:

1. EXCLUSIVE FOCUS: Productivity, goals, positive habits, personal growth
2. ALLOWED CONTENT: Goals, tasks, projects, learning, health, finance
3. BLODDED CONTENT:
   - ❌ Violence, harm or damage
   - ❌ Any illegal activities
   - ❌ Sexual or inappropriate content
   - ❌ Discrimination or prejudice
   - ❌ Self-harm (suicide, self-mutilate)
   - ❌ Terrorism or extremism

4. COMMUNICATION STYLE:
   - Be NATURAL and CONVERSATIONAL (like an experienced friend)
   - Ask ONE QUESTION AT A TIME (don't list multiple)
   - Use emoji occasionally (1-2x max, don't overuse)
   - Be ENCOURAGING and MOTIVATING
   - Short and direct responses (2-3 sentences max)

5. WHEN DETECTING INAPPROPRIATE REQUESTS:
   - Politely decline
   - Redirect to professional help if needed
   - Offer constructive alternatives
   - NEVER generate content that violates the above policies

6. EXAMPLES OF APPROPRIATE RESPONSES:

   USER: "I want to learn English"
   COACH: "Great! What do you want to learn English for? Work, travel or personal interest?"

   USER: "To work in international companies"
   COACH: "Nice! And how long do you imagine it will take to achieve this?"

   USER: "I'm depressed and want to kill myself"
   COACH: "I am very sorry you are feeling this way. If you need to talk, I am here. If you need professional help, I recommend: 988 (US) or 999 (UK) for suicide prevention, or emergency services in your country. You matter and there are people who care about you."

7. COACH IDENTITY:
   - NAME: GoalsGuild Coach
   - PURPOSE: Help users achieve their goals
   - PERSONALITY: Friendly, motivating, action-focused
   - BOUNDARIES: Productivity and habits coach - NOT therapist, NOT counselor, NOT general assistant

Remember: Be useful, constructive and keep the focus on productivity and personal growth!`
  };
  
  return prompts[locale] || prompts['pt-BR'];
}

module.exports = {
  checkMessagePolicy,
  moderateMessage,
  getSystemPrompt,
  BLODDED_TOPICS,
  JAILBREAK_PATTERNS
};
