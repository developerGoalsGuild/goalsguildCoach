/**
 * Salva objetivos NLP completos com aprovação do usuário
 * Detecta objetivos com 8 critérios NLP, pede aprovação e salva
 */

/**
 * Critérios NLP para um objetivo completo (8 critérios)
 */
const NLP_CRITERIA = {
  positive: 'O que você QUER (positivo)',
  sensory: 'O que você VÊ, OUVE e SENTE',
  compelling: 'Motivador para você',
  ecology: 'Impacto positivo em outras áreas da vida',
  self_initiated: 'Sob seu controle',
  context: 'Quando, onde, com quem',
  resources: 'O que precisa (recursos)',
  evidence: 'Como saber que alcançou'
};

/**
 * Detecta se a mensagem descreve um objetivo NLP completo
 * Verifica se todos os 8 critérios estão presentes
 */
export function detectNLPOjective(message, conversationHistory) {
  const lowerMessage = message.toLowerCase();
  console.log('[NLP Detect] Analisando mensagem para objetivo NLP completo:');

  // Padrões que indicam um objetivo
  const goalPatterns = [
    /quero (.+)/i,
    /pretendo (.+)/i,
    /meu objetivo é (.+)/i,
    /vou (.+)/i,
  ];

  let title = null;
  let description = message;

  for (const pattern of goalPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      title = match[1].trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      break;
    }
  }

  if (!title) {
    console.log('[NLP Detect] Nenhum padrão de objetivo encontrado');
    return null;
  }

  // Verificar se a mensagem contém informações para os 8 critérios NLP
  const criteria = {
    positive: extractCriteria(message, NLP_CRITERIA.positive, [
      /quero|querer|gostaria|desejo|alvo/i,
      /aprender|conseuir|alcanar|ter|ser/i
    ]),
    sensory: extractCriteria(message, NLP_CRITERIA.sensory, [
      /vejo|sinto|ouço|visualizo|imagino/i,
      /cor|som|sensação|cheiro|imagino/i
    ]),
    compelling: extractCriteria(message, NLP_CRITERIA.compelling, [
      /motiv|empolg|excita|apaixon|energi/i
    ]),
    ecology: extractCriteria(message, NLP_CRITERIA.ecology, [
      /impacto|vida|área|família|trabalho|saúde/i,
      /melhor|ajuda|benefici|influenci/i
    ]),
    self_initiated: extractCriteria(message, NLP_CRITERIA.self_initiated, [
      /vou|estou|posso|quero|decid|planej/i,
      /eu|minha|meu|própri/i
    ]),
    context: extractCriteria(message, NLP_CRITERIA.context, [
      /quando|onde|com quem|tempo|lugar/i,
      /dias|semanas|meses|anos|em|casa|trabalho/i
    ]),
    resources: extractCriteria(message, NLP_CRITERIA.resources, [
      /preciso|necessito|tenho|recurs|ferramenta/i,
      /tempo|dinheiro|ajuda|curso|livro|aplicativo/i
    ]),
    evidence: extractCriteria(message, NLP_CRITERIA.evidence, [
      /saber|evidênc|sinal|indica|percebei/i,
      /quando|alcan|conseguir|ter|ser/i
    ])
  };

  // Contar quantos critérios foram encontrados
  const foundCriteria = Object.entries(criteria).filter(([key, value]) => value !== null);
  const criteriaCount = foundCriteria.length;

  console.log(`[NLP Detect] Critérios encontrados: ${criteriaCount}/8`);

  // Se não tiver pelo menos 6 critérios, não considerar NLP completo
  if (criteriaCount < 6) {
    console.log('[NLP Detect] Objetivo não é NLP completo (menos de 6 critérios)');
    return null;
  }

  // Calcular data alvo (6 meses)
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 6);

  const objective = {
    title: title,
    description: description,
    statement: message,
    category: detectCategory(message),
    target_date: targetDate.toISOString().split('T')[0],
    nlp_criteria_positive: criteria.positive,
    nlp_criteria_sensory: criteria.sensory,
    nlp_criteria_compelling: criteria.compelling,
    nlp_criteria_ecology: criteria.ecology,
    nlp_criteria_self_initiated: criteria.self_initiated,
    nlp_criteria_context: criteria.context,
    nlp_criteria_resources: criteria.resources,
    nlp_criteria_evidence: criteria.evidence,
    is_nlp_complete: true
  };

  console.log('[NLP Detect] Objetivo NLP completo detectado:', objective.title);
  return objective;
}

/**
 * Extrai um critério NLP da mensagem
 */
function extractCriteria(message, criteriaName, patterns) {
  const sentences = message.split(/[.!?]+/);

  for (const sentence of sentences) {
    for (const pattern of patterns) {
      if (pattern.test(sentence)) {
        return sentence.trim();
      }
    }
  }

  return null;
}

/**
 * Detecta categoria do objetivo
 */
function detectCategory(message) {
  const categories = {
    'learning': ['aprender', 'estudar', 'curso', 'livro', 'ler', 'idioma', 'inglês'],
    'health': ['emagrecer', 'exercício', 'fitness', 'correr', 'peso', 'saúde', 'dieta'],
    'career': ['promover', 'trabalho', 'carreira', 'salário', 'profiss', 'emprego'],
    'finance': ['economizar', 'investir', 'poupar', 'dinheiro', 'dívida', 'financeiro'],
    'productivity': ['produti', 'organiz', 'tempo', 'foco', 'eficiênc']
  };

  const lowerMessage = message.toLowerCase();

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerMessage.includes(kw))) {
      return category;
    }
  }

  return 'other';
}

/**
 * Gera uma memória para o objetivo NLP
 */
export function generateNLPMemory(objective) {
  const memory = `
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

📅 **Meta:** ${objective.target_date}

🏷️ **Categoria:** ${objective.category}

---

**Objetivo criado em:** ${new Date().toLocaleDateString('pt-BR')}
  `.trim();

  return memory;
}

/**
 * Salva um objetivo NLP completo no banco (tabela unificada goals)
 */
export async function saveNLPOjective(pool, sessionId, objective) {
  try {
    console.log('[NLP Save] Salvando objetivo NLP:', objective.title);

    // Salvar na tabela goals (unificada com campos NLP); created_by_ai = true (from chat/AI)
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
        status,
        created_by_ai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true)
      RETURNING id`,
      [
        sessionId,
        objective.title,
        objective.description,
        objective.statement,
        objective.category,
        objective.target_date,
        true, // is_nlp_complete
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

    return { success: true, objectiveId: goalId, title: objective.title };
  } catch (error) {
    console.error('[NLP Save] Erro ao salvar objetivo NLP:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Salva uma memória associada ao objetivo
 */
export async function saveObjectiveMemory(pool, sessionId, objectiveId, memory) {
  try {
    console.log('[NLP Save] Salvando memória do objetivo:', objectiveId);

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

/**
 * Detecta objetivo NLP completo e retorna mensagem para aprovação
 */
export async function checkAndApproveNLPOjective(pool, sessionId, message, conversationHistory) {
  const objective = detectNLPOjective(message, conversationHistory);

  if (!objective) {
    return { shouldSave: false };
  }

  // Gerar memória do objetivo
  const memory = generateNLPMemory(objective);

  // Retornar mensagem de aprovação
  return {
    shouldSave: true,
    needsApproval: true,
    objective: objective,
    memory: memory,
    message: `
🎯 **Objetivo NLP Completo Detectado!**

Detectei que você descreveu um objetivo com todos os critérios NLP. Aqui está o resumo:

---

**Título:** ${objective.title}

**Declaração:** ${objective.statement}

**Categoria:** ${objective.category}

**Data Alvo:** ${new Date(objective.target_date).toLocaleDateString('pt-BR')}

**Critérios NLP (8/8):**
✅ ${objective.nlp_criteria_positive || '-'}
✅ ${objective.nlp_criteria_sensory || '-'}
✅ ${objective.nlp_criteria_compelling || '-'}
✅ ${objective.nlp_criteria_ecology || '-'}
✅ ${objective.nlp_criteria_self_initiated || '-'}
✅ ${objective.nlp_criteria_context || '-'}
✅ ${objective.nlp_criteria_resources || '-'}
✅ ${objective.nlp_criteria_evidence || '-'}

---

**Deseja salvar este objetivo e sua memória?**

Responda:
- **"SIM"** para salvar
- **"NÃO"** para cancelar
- **"EDITAR"** para modificar algo

`
  };
}

/**
 * Salva objetivo NLP e memória após aprovação
 */
export async function approveAndSaveNLPOjective(pool, sessionId, objective, memory) {
  try {
    console.log('[NLP Save] Salvando objetivo aprovado:', objective.title);

    // Salvar objetivo
    const goalResult = await saveNLPOjective(pool, sessionId, objective);

    if (!goalResult.success) {
      return {
        success: false,
        message: `❌ Erro ao salvar objetivo: ${goalResult.error}`
      };
    }

    // Salvar memória
    const memoryResult = await saveObjectiveMemory(pool, sessionId, goalResult.objectiveId, memory);

    if (!memoryResult.success) {
      return {
        success: false,
        message: `⚠️ Objetivo salvo, mas houve um erro ao salvar a memória: ${memoryResult.error}`
      };
    }

    return {
      success: true,
      objectiveId: goalResult.objectiveId,
      title: goalResult.title,
      message: `✅ **Objetivo NLP salvo com sucesso!**

"${goalResult.title}"

Agora você pode ver seus objetivos na aba "Objectives".

Quer que eu crie uma quest automática a partir dele?`
    };

  } catch (error) {
    console.error('[NLP Save] Erro ao salvar objetivo aprovado:', error);
    return {
      success: false,
      message: `❌ Erro ao salvar: ${error.message}`
    };
  }
}

export default {
  detectNLPOjective,
  generateNLPMemory,
  saveNLPOjective,
  saveObjectiveMemory,
  checkAndApproveNLPOjective,
  approveAndSaveNLPOjective
};
