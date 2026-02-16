// Atualização de route.js para incluir rastreamento de custos
// Adicionar no processWithOpenAI function:

// ======== IMPORTAR COST TRACKING ========
const { trackUsage } = require('../../lib/cost-tracking');

// ======== ATUALIZAR processWithOpenAI ========
async function processWithOpenAI(message, sessionId, pool, userId) {
  const startTime = Date.now();
  const OpenAI = require('openai');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  // Buscar histórico recente
  const historyResult = await pool.query(
    'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 10',
    [sessionId]
  );

  const history = historyResult.rows.reverse();
  
  // Montar mensagens para OpenAI
  const messages = [
    {
      role: 'system',
      content: `Você é um Coach de Produtividade amigável e conversacional...`
    },
    ...history.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }))
  ];

  let response;
  let statusCode = 200;
  let errorMessage = null;

  try {
    response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    // ======== RASTREAR USO ========
    const responseTime = Date.now() - startTime;
    const usage = response.usage;
    
    await trackUsage({
      userId: userId,
      sessionId: sessionId,
      model: 'gpt-4o-mini',
      provider: 'openai',
      inputTokens: usage?.prompt_tokens || 0,
      outputTokens: usage?.completion_tokens || 0,
      endpoint: '/chat/completions',
      responseTimeMs: responseTime,
      statusCode: statusCode,
      errorMessage: errorMessage
    });

    console.log(`Cost tracked: $${((usage?.prompt_tokens || 0) / 1000000 * 0.15 + (usage?.completion_tokens || 0) / 1000000 * 0.60).toFixed(6)}`);

  } catch (error) {
    console.error('OpenAI error:', error);
    statusCode = error.status || 500;
    errorMessage = error.message;
    
    // ======== RASTREAR ERRO ========
    await trackUsage({
      userId: userId,
      sessionId: sessionId,
      model: 'gpt-4o-mini',
      provider: 'openai',
      inputTokens: 0,
      outputTokens: 0,
      endpoint: '/chat/completions',
      responseTimeMs: Date.now() - startTime,
      statusCode: statusCode,
      errorMessage: errorMessage
    });
    
    throw error;
  }

  return response.choices[0].message.content || 
    'Desculpe, não consegui gerar uma resposta agora. Tenta de novo!';
}

// ======== ATUALIZAR A FUNÇÃO POST ========
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;
  const userId = user.userId; // ======== ADICIONAR ========

  try {
    const { message, objectiveData, createQuest } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const pool = getPool();

    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    const hasOpenAI = !!process.env.OPENAI_API_KEY && 
                      process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
                      process.env.OPENAI_API_KEY.length > 20;

    let assistantMessage = '';

    if (!hasOpenAI) {
      assistantMessage = await processWithoutOpenAI(message, sessionId, pool);
    } else {
      try {
        assistantMessage = await processWithOpenAI(message, sessionId, pool, userId); // ======== ADICIONAR userId ========
      } catch (openaiError) {
        console.error('OpenAI error:', openaiError);
        assistantMessage = await processWithoutOpenAI(message, sessionId, pool);
      }
    }

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
