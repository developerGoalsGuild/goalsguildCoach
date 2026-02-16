import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { getUserFromToken } from '../../lib/auth';
import OpenAI from 'openai';

// GET - Listar todos os objetivos do usuário (tabela unificada goals)
export async function GET(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    const sessionId = user.userId; // Usar userId como session_id
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        target_date,
        progress,
        status,
        category,
        is_nlp_complete,
        nlp_criteria_positive,
        nlp_criteria_sensory,
        nlp_criteria_compelling,
        nlp_criteria_ecology,
        nlp_criteria_self_initiated,
        nlp_criteria_context,
        nlp_criteria_resources,
        nlp_criteria_evidence,
        created_at
      FROM goals
      WHERE session_id = $1::text
      ORDER BY created_at DESC
    `, [sessionId]);

    return NextResponse.json({ goals: result.rows });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

/**
 * Gera memória NLP usando LLM
 */
async function generateNLPMemoryWithLLM(objective) {
  const hasOpenAI = !!process.env.OPENAI_API_KEY && 
                    process.env.OPENAI_API_KEY !== 'your-openai-api-key' &&
                    process.env.OPENAI_API_KEY.length > 20;

  if (!hasOpenAI) {
    // Fallback: gerar memória formatada sem LLM
    return generateNLPMemoryFallback(objective);
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Você é um coach especializado em NLP (Programação Neurolinguística). Crie uma memória rica e contextualizada para este objetivo NLP completo.

**Objetivo:** ${objective.title}
${objective.description ? `**Descrição:** ${objective.description}\n` : ''}

**Critérios NLP:**

1. **Positivo (o que quer):** ${objective.nlp_criteria_positive || 'Não informado'}
2. **Sensorial (vê, ouve, sente):** ${objective.nlp_criteria_sensory || 'Não informado'}
3. **Motivador (por que é empolgante):** ${objective.nlp_criteria_compelling || 'Não informado'}
4. **Ecologia (impacto na vida):** ${objective.nlp_criteria_ecology || 'Não informado'}
5. **Auto-iniciado (sob controle):** ${objective.nlp_criteria_self_initiated || 'Não informado'}
6. **Contexto (quando, onde, com quem):** ${objective.nlp_criteria_context || 'Não informado'}
7. **Recursos (o que precisa):** ${objective.nlp_criteria_resources || 'Não informado'}
8. **Evidência (como saber que alcançou):** ${objective.nlp_criteria_evidence || 'Não informado'}

${objective.target_date ? `**Data Alvo:** ${objective.target_date}\n` : ''}
${objective.category ? `**Categoria:** ${objective.category}\n` : ''}

Crie uma memória formatada que:
- Resuma o objetivo de forma clara e inspiradora
- Destaque os aspectos mais importantes dos critérios NLP
- Seja útil para o coach entender o contexto e motivação do usuário
- Use formatação markdown para organização
- Seja concisa mas completa (máximo 500 palavras)

Formato esperado:
**Objetivo NLP Completo: [título]**

📝 **Declaração:**
[resumo do que o usuário quer]

✅ **Critérios NLP:**
[resumo dos critérios mais relevantes]

🎯 **Contexto e Motivação:**
[contexto, motivação e recursos]

📅 **Meta:** [data alvo se houver]

🏷️ **Categoria:** [categoria se houver]

---

**Objetivo criado em:** ${new Date().toLocaleDateString('pt-BR')}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um coach especializado em NLP. Crie memórias ricas e contextualizadas para objetivos NLP.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const memory = completion.choices[0]?.message?.content?.trim();
    return memory || generateNLPMemoryFallback(objective);
  } catch (error) {
    console.error('[LLM Memory] Erro ao gerar memória com LLM:', error);
    return generateNLPMemoryFallback(objective);
  }
}

/**
 * Gera memória formatada básica (fallback)
 */
function generateNLPMemoryFallback(objective) {
  return `
**Objetivo NLP Completo: ${objective.title}**

📝 **Declaração:**
${objective.description || objective.title}

✅ **Critérios NLP:**

1. **Positivo:** ${objective.nlp_criteria_positive || 'Não informado'}
2. **Sensorial:** ${objective.nlp_criteria_sensory || 'Não informado'}
3. **Motivador:** ${objective.nlp_criteria_compelling || 'Não informado'}
4. **Ecologia:** ${objective.nlp_criteria_ecology || 'Não informado'}
5. **Auto-iniciado:** ${objective.nlp_criteria_self_initiated || 'Não informado'}
6. **Contexto:** ${objective.nlp_criteria_context || 'Não informado'}
7. **Recursos:** ${objective.nlp_criteria_resources || 'Não informado'}
8. **Evidência:** ${objective.nlp_criteria_evidence || 'Não informado'}

${objective.target_date ? `📅 **Data Alvo:** ${objective.target_date}\n` : ''}
${objective.category ? `🏷️ **Categoria:** ${objective.category}\n` : ''}

---

**Objetivo criado em:** ${new Date().toLocaleDateString('pt-BR')}
  `.trim();
}

/**
 * Salva memória do objetivo na tabela objective_memories
 */
async function saveObjectiveMemory(pool, sessionId, objectiveId, memory) {
  try {
    await pool.query(
      `INSERT INTO objective_memories (
        objective_id,
        session_id,
        memory,
        created_at
      ) VALUES ($1, $2, $3, NOW())
      RETURNING id`,
      [objectiveId, sessionId, memory]
    );
    console.log('[Goals API] Memória NLP salva para objetivo:', objectiveId);
    return { success: true };
  } catch (error) {
    console.error('[Goals API] Erro ao salvar memória:', error);
    // Não falhar se a tabela não existir
    if (error.message.includes('does not exist')) {
      console.warn('[Goals API] Tabela objective_memories não existe, pulando salvamento de memória');
      return { success: false, skipped: true };
    }
    return { success: false, error: error.message };
  }
}

// POST - Criar novo objetivo (simples ou NLP completo)
export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId = user.userId; // Usar userId como session_id
    
    // Validar campos obrigatórios
    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const pool = getPool();

    // Criar objetivo
    const result = await pool.query(`
      INSERT INTO goals (
        session_id,
        title,
        description,
        target_date,
        category,
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
      ) VALUES (
        $1::text, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
      )
      RETURNING id, title, is_nlp_complete
    `, [
      sessionId,
      body.title,
      body.description || null,
      body.target_date || null,
      body.category || null,
      body.is_nlp_complete || false,
      body.nlp_criteria_positive || null,
      body.nlp_criteria_sensory || null,
      body.nlp_criteria_compelling || null,
      body.nlp_criteria_ecology || null,
      body.nlp_criteria_self_initiated || null,
      body.nlp_criteria_context || null,
      body.nlp_criteria_resources || null,
      body.nlp_criteria_evidence || null,
      'active'
    ]);

    const goal = result.rows[0];
    
    // Se o objetivo é NLP completo, gerar e salvar memória usando LLM
    if (goal.is_nlp_complete) {
      try {
        const objectiveData = {
          title: body.title,
          description: body.description,
          target_date: body.target_date,
          category: body.category,
          nlp_criteria_positive: body.nlp_criteria_positive,
          nlp_criteria_sensory: body.nlp_criteria_sensory,
          nlp_criteria_compelling: body.nlp_criteria_compelling,
          nlp_criteria_ecology: body.nlp_criteria_ecology,
          nlp_criteria_self_initiated: body.nlp_criteria_self_initiated,
          nlp_criteria_context: body.nlp_criteria_context,
          nlp_criteria_resources: body.nlp_criteria_resources,
          nlp_criteria_evidence: body.nlp_criteria_evidence
        };

        const memory = await generateNLPMemoryWithLLM(objectiveData);
        await saveObjectiveMemory(pool, sessionId, goal.id, memory);
      } catch (error) {
        console.error('[Goals API] Erro ao gerar/salvar memória NLP:', error);
        // Não falhar a criação do objetivo se a memória falhar
      }
    }
    
    return NextResponse.json({ 
      goal: goal,
      message: goal.is_nlp_complete 
        ? 'Objetivo NLP completo criado!' 
        : 'Objetivo criado!'
    });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }
}
