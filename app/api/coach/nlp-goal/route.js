import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { getCoachResponse } from '../../../lib/openai';

// GET - Iniciar sessão de definição de objetivo NLP
export async function GET(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pool = getPool();
    
    // Buscar histórico de mensagens recentes para contexto
    const messagesResult = await pool.query(`
      SELECT role, content
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [sessionId]);

    const history = messagesResult.rows.reverse();

    // Pergunta inicial do coach para iniciar definição de objetivo
    const initialPrompt = {
      role: 'user',
      content: 'Usuário quer definir um novo objetivo usando NLP Well-Formed Outcomes. Inicie o processo perguntando: "O que você quer?"'
    };

    const coachResponse = await getCoachResponse(
      [...history, initialPrompt],
      { tone: 'sharp', specialization: 'general', archetype: 'mentor' }
    );

    return NextResponse.json({ 
      message: coachResponse,
      phase: 'clarification'
    });
  } catch (error) {
    console.error('Error initiating NLP goal setting:', error);
    return NextResponse.json({ error: 'Failed to initiate' }, { status: 500 });
  }
}

// POST - Continuar processo de definição com NLP
export async function POST(request) {
  const sessionId = request.cookies.get('session_id')?.value;
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { userMessage, phase, objectiveData } = body;

    const pool = getPool();

    // Salvar mensagem do usuário
    await pool.query(`
      INSERT INTO messages (session_id, role, content)
      VALUES ($1, 'user', $2)
    `, [sessionId, userMessage]);

    // Buscar histórico
    const messagesResult = await pool.query(`
      SELECT role, content
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [sessionId]);

    const history = messagesResult.reverse();

    // Determinar próximo prompt baseado na fase
    let systemPrompt = '';
    
    switch(phase) {
      case 'clarification':
        systemPrompt = userMessage;
        break;
      case 'positive':
        systemPrompt = `Usuário respondeu: "${userMessage}". Avalie se está em positivo. Se não estiver, pergunte "O que você GOSTARIA de ter no lugar disso?". Se estiver, avance para pergunta sensorial (o que vê, ouve, sente).`;
        break;
      case 'sensory':
        systemPrompt = `Usuário respondeu: "${userMessage}". Extraia elementos sensoriais (o que vê, ouve, sente). Se faltar algo, pergunte especificamente. Se tiver, avance para pergunta sobre se é compelling/atraente.`;
        break;
      case 'compelling':
        systemPrompt = `Usuário respondeu: "${userMessage}". Avalie se isso é compelling/atraente ou é uma obrigação. Se não for compelling, pergunte "Como podemos tornar isso mais atraente?". Se for, avance para ecology check (família, saúde, finanças).`;
        break;
      case 'ecology':
        systemPrompt = `Usuário respondeu: "${userMessage}". Verifique impacto em famlia, saúde e finanças. Se identificar conflito, ofereça 2-3 opções de resolução e pergunte "Qual funciona para você?". Se estiver ok, avance para pergunta sobre controle (self-initiated).`;
        break;
      case 'control':
        systemPrompt = `Usuário respondeu: "${userMessage}". Verifique se está sob controle do usuário. Se não estiver, ajude a reformular para algo que ele possa controlar. Se estiver, avance para pergunta sobre contexto (quando, onde, com quem).`;
        break;
      case 'context':
        systemPrompt = `Usuário respondeu: "${userMessage}". Identifique contexto (quando, onde, com quem). Se faltar, pergunte. Se tiver, avance para pergunta sobre recursos necessários.`;
        break;
      case 'resources':
        systemPrompt = `Usuário respondeu: "${userMessage}". Identifique recursos necessários (internos e externos). Se faltar algo importante, pergunte. Se tiver, avance para pergunta sobre evidência (como vai saber que conseguiu).`;
        break;
      case 'evidence':
        systemPrompt = `Usuário respondeu: "${userMessage}". Identifique evidência de sucesso (como vai saber). Tente capturar isso com precisão. Depois, confirme todos os 8 pontos e pergunte "Isso soa certo para você?"`;
        break;
      case 'confirmation':
        if (userMessage.toLowerCase().includes('sim') || userMessage.toLowerCase().includes('é isso')) {
          // Salvar objetivo completo
          return NextResponse.json({
            saveObjective: true,
            message: 'Perfeito! Salvando seu objetivo...',
            objectiveData
          });
        } else {
          return NextResponse.json({
            needsAdjustment: true,
            message: 'Entendi. Me conta o que precisa ajustar.'
          });
        }
        break;
      default:
        systemPrompt = userMessage;
    }

    // Obter resposta do coach
    const coachResponse = await getCoachResponse(
      [...history, { role: 'user', content: systemPrompt }],
      { tone: 'sharp', specialization: 'general', archetype: 'mentor' }
    );

    // Salvar resposta do coach
    await pool.query(`
      INSERT INTO messages (session_id, role, content)
      VALUES ($1, 'assistant', $2)
    `, [sessionId, coachResponse]);

    // Determinar próxima fase
    const nextPhase = getNextPhase(phase, userMessage);

    return NextResponse.json({ 
      message: coachResponse,
      nextPhase
    });
  } catch (error) {
    console.error('Error in NLP goal setting:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

function getNextPhase(currentPhase, userMessage) {
  const phases = [
    'clarification',
    'positive',
    'sensory',
    'compelling',
    'ecology',
    'control',
    'context',
    'resources',
    'evidence',
    'confirmation'
  ];

  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex === -1) return 'clarification';

  // Se usuário confirmou ou parece ter respondido bem, avança
  if (userMessage.length > 10 && !userMessage.includes('não') && !userMessage.includes('não sei')) {
    return phases[currentIndex + 1] || 'confirmation';
  }

  return phases[currentIndex];
}
