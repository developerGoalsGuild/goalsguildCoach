#!/usr/bin/env node
/**
 * Simula o fluxo completo de criação de objetivo NLP + aprovação + criação de quest
 * 
 * Testa:
 * 1. Conversa NLP até objetivo completo
 * 2. Detecção de pendingApproval: true
 * 3. Aprovação com "sim"
 * 4. Verificação de objetivo salvo e quest criada
 * 
 * Uso:
 *   TEST_TOKEN=eyJ... node scripts/simulate-nlp-objective-approval.js
 *   TEST_EMAIL=user@test.com TEST_PASSWORD=Senha123 node scripts/simulate-nlp-objective-approval.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

// Token de autenticação (pode vir de env ou ser obtido via login)
let AUTH_TOKEN = process.env.TEST_TOKEN;

// Mensagens simuladas para criar um objetivo NLP completo
const CONVERSATION = [
  'Eu quero comprar um barco',
  'Em 6 meses',
  'Eu me vejo navegando no mar, sentindo a liberdade e a paz',
  'Isso me dá uma sensação de realização pessoal e independência',
  'Vou ter que reduzir gastos com entretenimento e economizar mais',
  'Vou criar um orçamento mensal e separar uma quantia fixa para o barco',
  'Vou pesquisar modelos, economizar e fazer o pagamento',
  'Preciso de dinheiro suficiente e conhecimento sobre barcos',
  'Quando eu tiver o barco na minha garagem e puder navegar nos fins de semana',
];

async function login(email, password) {
  console.log('🔐 Fazendo login...');
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Login falhou: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

async function sendMessage(message, token) {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message, locale: 'pt-BR' })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(`Erro ao enviar mensagem: ${error.error || response.statusText}`);
  }

  return await response.json();
}

async function checkObjectiveSaved(token) {
  console.log('📋 Verificando objetivos salvos...');
  const response = await fetch(`${BASE_URL}/api/goals`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.log('⚠️  Não foi possível verificar objetivos');
    return [];
  }

  const data = await response.json();
  return data.goals || [];
}

async function checkQuestsCreated(token) {
  console.log('⚔️  Verificando quests criadas...');
  const response = await fetch(`${BASE_URL}/api/quests`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    console.log('⚠️  Não foi possível verificar quests');
    return [];
  }

  const data = await response.json();
  return data.quests || [];
}

async function simulate() {
  console.log('📝 Simulação: Fluxo completo NLP Objetivo + Aprovação + Quest\n');
  console.log('─────────────────────────────────────────\n');

  try {
    // 1. Obter token
    if (!AUTH_TOKEN) {
      const email = process.env.TEST_EMAIL;
      const password = process.env.TEST_PASSWORD;

      if (!email || !password) {
        console.error('❌ Erro: Defina TEST_TOKEN ou TEST_EMAIL + TEST_PASSWORD');
        console.log('\nExemplos:');
        console.log('  TEST_TOKEN=eyJ... node scripts/simulate-nlp-objective-approval.js');
        console.log('  TEST_EMAIL=user@test.com TEST_PASSWORD=Senha123 node scripts/simulate-nlp-objective-approval.js');
        process.exit(1);
      }

      AUTH_TOKEN = await login(email, password);
      console.log('✅ Login realizado com sucesso\n');
    } else {
      console.log('✅ Usando token fornecido\n');
    }

    // 2. Enviar mensagens da conversa
    console.log('💬 Iniciando conversa NLP...\n');
    let lastResponse = null;
    let pendingApproval = false;
    let objectiveComplete = false;

    for (let i = 0; i < CONVERSATION.length; i++) {
      const message = CONVERSATION[i];
      console.log(`📤 Mensagem ${i + 1}/${CONVERSATION.length}: "${message}"`);

      const response = await sendMessage(message, AUTH_TOKEN);
      console.log(`📥 Resposta: ${response.message.substring(0, 100)}${response.message.length > 100 ? '...' : ''}\n`);

      // Verificar se objetivo está completo e pendente de aprovação
      if (response.pendingApproval === true) {
        console.log('🎯 ✅ Objetivo NLP completo detectado! (pendingApproval: true)\n');
        pendingApproval = true;
        objectiveComplete = true;
        lastResponse = response;
        break;
      }

      // Verificar se a resposta indica objetivo completo (fallback)
      if (response.message.includes('🎯 Objetivo NLP Completo!') || 
          response.message.includes('Deseja salvar este objetivo')) {
        console.log('🎯 ✅ Objetivo NLP completo detectado na resposta!\n');
        objectiveComplete = true;
        lastResponse = response;
        // Continuar para enviar aprovação
        break;
      }

      // Pequena pausa entre mensagens
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!objectiveComplete) {
      console.log('⚠️  Objetivo NLP completo não foi detectado após todas as mensagens.');
      console.log('   A conversa pode precisar de mais mensagens ou o objetivo já foi salvo.\n');
      
      // Verificar se já existe objetivo salvo
      const objectives = await checkObjectiveSaved(AUTH_TOKEN);
      if (objectives.length > 0) {
        console.log(`✅ Encontrados ${objectives.length} objetivo(s) já salvos:`);
        objectives.slice(0, 3).forEach(obj => {
          console.log(`   - ${obj.title || obj.name || 'Sem título'}`);
        });
      }
      return;
    }

    // 3. Aprovar objetivo
    console.log('✅ Enviando aprovação: "sim"\n');
    const approvalResponse = await sendMessage('sim', AUTH_TOKEN);
    console.log(`📥 Resposta de aprovação: ${approvalResponse.message.substring(0, 150)}${approvalResponse.message.length > 150 ? '...' : ''}\n`);

    // Verificar se objetivo foi salvo
    const objectives = await checkObjectiveSaved(AUTH_TOKEN);
    const newObjectives = objectives.filter(obj => {
      // Objetivos criados recentemente (últimos 2 minutos)
      const createdAt = new Date(obj.created_at || obj.createdAt);
      const now = new Date();
      return (now - createdAt) < 2 * 60 * 1000;
    });

    if (newObjectives.length > 0) {
      console.log(`✅ Objetivo salvo com sucesso! (${newObjectives.length} novo(s)):`);
      newObjectives.forEach(obj => {
        console.log(`   📌 Título: ${obj.title || obj.name || 'Sem título'}`);
        console.log(`   📅 Criado em: ${obj.created_at || obj.createdAt}`);
        if (obj.is_nlp_complete) console.log(`   ✅ NLP completo: Sim`);
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhum objetivo novo encontrado após aprovação.');
      if (objectives.length > 0) {
        console.log(`   (Mas existem ${objectives.length} objetivo(s) no total)`);
      }
    }

    // Verificar se quest foi criada
    await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar criação da quest
    const quests = await checkQuestsCreated(AUTH_TOKEN);
    const newQuests = quests.filter(quest => {
      const createdAt = new Date(quest.created_at || quest.createdAt);
      const now = new Date();
      return (now - createdAt) < 2 * 60 * 1000;
    });

    if (newQuests.length > 0) {
      console.log(`⚔️  Quest criada automaticamente! (${newQuests.length} nova(s)):`);
      newQuests.forEach(quest => {
        console.log(`   📌 Título: ${quest.title || quest.name || 'Sem título'}`);
        console.log(`   📊 Milestones: ${quest.milestones_completed || 0}/${quest.milestones_total || 0}`);
        if (quest.xp_reward) console.log(`   ⭐ XP: ${quest.xp_reward}`);
      });
      console.log('');
    } else {
      console.log('⚠️  Nenhuma quest nova encontrada após aprovação.');
      if (quests.length > 0) {
        console.log(`   (Mas existem ${quests.length} quest(s) no total)`);
      }
      console.log('');
    }

    // Resumo final
    console.log('─────────────────────────────────────────');
    if (newObjectives.length > 0 && newQuests.length > 0) {
      console.log('✅ ✅ SUCESSO COMPLETO!');
      console.log('   ✅ Objetivo NLP salvo');
      console.log('   ✅ Quest criada automaticamente');
    } else if (newObjectives.length > 0) {
      console.log('✅ Objetivo salvo, mas quest não foi criada automaticamente');
    } else {
      console.log('⚠️  Objetivo pode não ter sido salvo ou já existia');
    }
    console.log('─────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Erro na simulação:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

simulate();
