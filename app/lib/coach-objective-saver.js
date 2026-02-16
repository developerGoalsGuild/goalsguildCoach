/**
 * Funções auxiliares para salvar objetivos a partir da conversa do Coach
 */

/**
 * Detecta se uma mensagem descreve um objetivo completo
 */
export function detectGoalFromMessage(message, conversationHistory) {
  const lowerMessage = message.toLowerCase().trim();
  
  console.log('[DetectGoal] Analisando mensagem:', lowerMessage);
  
  // Padrões que indicam um objetivo bem definido
  const goalPatterns = [
    /quero (.+)/i,
    /pretendo (.+)/i,
    /meu objetivo é (.+)/i,
    /quero aprender (.+)/i,
    /quero conseuir (.+)/i,
    /vou (.+)/i,
    /estou (.+)/i,
  ];
  
  // Tentar extrair título do objetivo
  let title = null;
  let description = null;
  
  for (const pattern of goalPatterns) {
    const match = lowerMessage.match(pattern);
    if (match && match[1]) {
      // Extrair título e criar descrição
      title = match[1].trim();
      title = title.charAt(0).toUpperCase() + title.slice(1);
      description = `Objetivo: ${message}`;
      console.log('[DetectGoal] Padrão encontrado:', pattern, '| Título:', title);
      break;
    }
  }
  
  // Se não encontrou padrão, verificar se há um tópico específico
  if (!title) {
    const topics = {
      'inglês': 'Aprender Inglês',
      'exercício': 'Melhorar Fitness',
      'correr': 'Começar a Correr',
      'programar': 'Aprender Programação',
      'emagrecer': 'Perder Peso',
      'poupar de fumar': 'Parar de Fumar',
      'ler mais': 'Ler Mais Livros',
      'economizar': 'Economizar Dinheiro',
    };
    
    for (const [keyword, goalTitle] of Object.entries(topics)) {
      if (lowerMessage.includes(keyword)) {
        title = goalTitle;
        description = message;
        console.log('[DetectGoal] Tópico encontrado:', keyword, '| Título:', title);
        break;
      }
    }
  }
  
  if (!title) {
    console.log('[DetectGoal] Nenhum objetivo detectado');
    return null;
  }
  
  // Calcular data alvo (padrão: 6 meses)
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + 6);
  
  const goal = {
    statement: message,
    title: title,
    description: description,
    timeline_target: targetDate.toISOString().split('T')[0],
    context_when: conversationHistory.slice(-3).map(m => m.content).join(' | ')
  };
  
  console.log('[DetectGoal] Objetivo detectado:', goal);
  return goal;
}

/**
 * Salva um objetivo no banco de dados (tabela unificada goals)
 */
export async function saveObjective(pool, sessionId, goalData) {
  try {
    console.log('[Coach] Salvando objetivo:', goalData.title);
    
    // Salvar na tabela goals (agora com campos NLP)
    const result = await pool.query(
      `INSERT INTO goals (
        session_id, title, description, target_date, category, 
        is_nlp_complete, statement
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id`,
      [
        sessionId,
        goalData.title,
        goalData.description || goalData.statement,
        goalData.timeline_target || null,
        goalData.category || null,
        false, // Por padrão, objetivos automáticos não são NLP completos
        goalData.statement || null
      ]
    );
    
    const goalId = result.rows[0].id;
    console.log('[Coach] Objetivo salvo com ID:', goalId);
    return { success: true, objectiveId: goalId, title: goalData.title };
  } catch (error) {
    console.error('[Coach] Erro ao salvar objetivo:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verifica se deve salvar e retorna mensagem apropriada
 */
export async function checkAndSaveObjective(pool, sessionId, message, conversationHistory) {
  const goalData = detectGoalFromMessage(message, conversationHistory);
  
  if (!goalData) {
    return { shouldSave: false };
  }
  
  const result = await saveObjective(pool, sessionId, goalData);
  
  if (result.success) {
    return {
      shouldSave: true,
      saved: true,
      title: result.title,
      objectiveId: result.objectiveId,
      message: `✅ **Objetivo salvo!** "${result.title}"\n\nAgora você pode ver seus objetivos na aba "Objectives". Quer que eu crie uma quest automática a partir dele?`
    };
  }
  
  return {
    shouldSave: true,
    saved: false,
    error: result.error
  };
}
