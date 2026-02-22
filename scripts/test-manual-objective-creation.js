// Script para testar criação manual de objetivo NLP completo
// Simula o formulário manual preenchendo todos os 8 critérios NLP
// Nota: Objetivos criados manualmente (POST /api/goals) não contam no limite de "objectives by AI".

const BASE_URL = 'http://localhost:3002';

// Dados de login
const LOGIN_DATA = {
  email: 'teste@goalsguild.com',
  password: 'teste123'
};

// Objetivo NLP completo para teste
const TEST_OBJECTIVE = {
  title: 'Aprender Inglês Fluente',
  description: 'Quero alcançar fluência em inglês para expandir minhas oportunidades profissionais e pessoais.',
  target_date: '2026-12-31',
  category: 'learning',
  is_nlp_complete: true,
  nlp_criteria_positive: 'Quero aprender inglês fluentemente para me comunicar com confiança em situações profissionais e pessoais',
  nlp_criteria_sensory: 'Me vejo falando fluentemente com estrangeiros, ouço-me pronunciando corretamente, sinto confiança ao me expressar',
  nlp_criteria_compelling: 'Me sinto livre e empolgado com a possibilidade de viajar sem barreiras linguísticas e expandir minha carreira internacionalmente',
  nlp_criteria_ecology: 'Vou ter que reduzir tempo nas redes sociais e algumas saídas aos finais de semana. Vou estudar de manhã cedo antes do trabalho e combinar com minha família os horários fixos de estudo',
  nlp_criteria_self_initiated: 'Vou estudar 1 hora por dia, fazer exercícios práticos e me comprometer com a consistência',
  nlp_criteria_context: 'Todos os dias às 6h da manhã, em casa no meu escritório, sozinho para manter o foco',
  nlp_criteria_resources: 'Preciso de aplicativos de aprendizado (Duolingo, Babbel), livros de gramática, tempo dedicado diariamente e apoio da família',
  nlp_criteria_evidence: 'Quando conseguir manter uma conversa de 30 minutos em inglês sem precisar traduzir mentalmente, e quando passar em uma entrevista de emprego em inglês'
};

// Fazer login e obter token
async function login() {
  console.log('🔐 Fazendo login...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(LOGIN_DATA)
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ Login bem-sucedido!');
      console.log(`📧 Usuário: ${data.user.email}`);
      console.log(`🔑 Token: ${data.token.substring(0, 50)}...\n`);
      return data.token;
    } else {
      console.log('❌ Falha no login');
      console.log('Resposta:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return null;
  }
}

// Criar objetivo NLP completo
async function createObjective(token) {
  console.log('📝 Criando objetivo NLP completo manualmente...\n');
  console.log('📋 Dados do objetivo:');
  console.log(`   Título: ${TEST_OBJECTIVE.title}`);
  console.log(`   Categoria: ${TEST_OBJECTIVE.category}`);
  console.log(`   Data Alvo: ${TEST_OBJECTIVE.target_date}`);
  console.log(`   NLP Completo: ${TEST_OBJECTIVE.is_nlp_complete ? 'Sim ✅' : 'Não ❌'}\n`);
  
  console.log('🎯 Critérios NLP:');
  console.log(`   1. Positivo: ${TEST_OBJECTIVE.nlp_criteria_positive.substring(0, 60)}...`);
  console.log(`   2. Sensorial: ${TEST_OBJECTIVE.nlp_criteria_sensory.substring(0, 60)}...`);
  console.log(`   3. Motivador: ${TEST_OBJECTIVE.nlp_criteria_compelling.substring(0, 60)}...`);
  console.log(`   4. Ecologia: ${TEST_OBJECTIVE.nlp_criteria_ecology.substring(0, 60)}...`);
  console.log(`   5. Auto-iniciado: ${TEST_OBJECTIVE.nlp_criteria_self_initiated.substring(0, 60)}...`);
  console.log(`   6. Contexto: ${TEST_OBJECTIVE.nlp_criteria_context.substring(0, 60)}...`);
  console.log(`   7. Recursos: ${TEST_OBJECTIVE.nlp_criteria_resources.substring(0, 60)}...`);
  console.log(`   8. Evidência: ${TEST_OBJECTIVE.nlp_criteria_evidence.substring(0, 60)}...\n`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(TEST_OBJECTIVE)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Objetivo criado com sucesso!\n');
      console.log('📊 Resposta da API:');
      console.log(`   ID: ${data.goal.id}`);
      console.log(`   Título: ${data.goal.title}`);
      console.log(`   NLP Completo: ${data.goal.is_nlp_complete ? 'Sim ✅' : 'Não ❌'}`);
      console.log(`   Mensagem: ${data.message}\n`);
      
      return data.goal;
    } else {
      console.log('❌ Erro ao criar objetivo');
      console.log(`   Status: ${response.status}`);
      console.log('   Resposta:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
    return null;
  }
}

// Verificar memória NLP gerada
async function checkMemory(token, objectiveId) {
  console.log('🧠 Verificando memória NLP gerada...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/goals/${objectiveId}/memory`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (data.nlpMemory) {
        console.log('✅ Memória NLP encontrada!\n');
        console.log('📝 Conteúdo da memória:');
        console.log('─'.repeat(80));
        console.log(data.nlpMemory.content);
        console.log('─'.repeat(80));
        console.log(`\n📅 Criada em: ${new Date(data.nlpMemory.created_at).toLocaleString('pt-BR')}\n`);
        return true;
      } else {
        console.log('⚠️  Objetivo criado mas memória NLP não foi gerada ainda');
        console.log('   (Pode levar alguns segundos para processar)\n');
        return false;
      }
    } else {
      console.log('⚠️  Erro ao buscar memória');
      console.log(`   Status: ${response.status}`);
      console.log('   Resposta:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar memória:', error.message);
    return false;
  }
}

// Listar objetivos criados
async function listObjectives(token) {
  console.log('📋 Listando objetivos criados...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/goals`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      const objectives = data.goals || [];
      console.log(`✅ Encontrados ${objectives.length} objetivo(s)\n`);
      
      objectives.forEach((obj, index) => {
        console.log(`${index + 1}. ${obj.title}`);
        console.log(`   ID: ${obj.id}`);
        console.log(`   NLP Completo: ${obj.is_nlp_complete ? 'Sim ✅' : 'Não ❌'}`);
        console.log(`   Criado em: ${new Date(obj.created_at).toLocaleString('pt-BR')}`);
        if (obj.target_date) {
          console.log(`   Data Alvo: ${obj.target_date}`);
        }
        console.log('');
      });
      
      return objectives;
    } else {
      console.log('❌ Erro ao listar objetivos');
      console.log(`   Status: ${response.status}`);
      console.log('   Resposta:', data);
      return [];
    }
  } catch (error) {
    console.log('❌ Erro ao listar objetivos:', error.message);
    return [];
  }
}

// Função principal
async function main() {
  console.log('🚀 TESTE: Criação Manual de Objetivo NLP Completo\n');
  console.log('='.repeat(80));
  console.log('');
  
  // 1. Login
  const token = await login();
  if (!token) {
    console.log('❌ Não foi possível fazer login. Abortando teste.\n');
    process.exit(1);
  }
  
  // 2. Criar objetivo
  const objective = await createObjective(token);
  if (!objective) {
    console.log('❌ Não foi possível criar objetivo. Abortando teste.\n');
    process.exit(1);
  }
  
  // 3. Aguardar um pouco para a memória ser processada
  console.log('⏳ Aguardando processamento da memória NLP (3 segundos)...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 4. Verificar memória
  const hasMemory = await checkMemory(token, objective.id);
  
  // 5. Listar todos os objetivos
  await listObjectives(token);
  
  // Resumo final
  console.log('='.repeat(80));
  console.log('📊 RESUMO DO TESTE\n');
  console.log(`✅ Login: Sucesso`);
  console.log(`✅ Criação de Objetivo: Sucesso`);
  console.log(`   - ID: ${objective.id}`);
  console.log(`   - Título: ${objective.title}`);
  console.log(`   - NLP Completo: ${objective.is_nlp_complete ? 'Sim' : 'Não'}`);
  console.log(`${hasMemory ? '✅' : '⚠️ '} Memória NLP: ${hasMemory ? 'Gerada com sucesso' : 'Não encontrada (pode estar processando)'}`);
  console.log('');
  console.log('='.repeat(80));
  console.log('');
  
  if (hasMemory) {
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('   A criação manual de objetivos com NLP está funcionando corretamente.');
    console.log('   A memória foi gerada usando LLM como esperado.\n');
  } else {
    console.log('⚠️  TESTE PARCIALMENTE CONCLUÍDO');
    console.log('   O objetivo foi criado, mas a memória pode estar sendo processada.');
    console.log('   Tente verificar novamente em alguns segundos.\n');
  }
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
