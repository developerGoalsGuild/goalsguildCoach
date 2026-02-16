#!/usr/bin/env node

/**
 * Teste Manual Completo - GoalsGuild Coach
 * Testa todas as funcionalidades principais
 */

const http = require('http');

// Configuração
const BASE_URL = 'http://localhost:3002';
const TEST_USER = {
  email: 'teste@goalsguild.com',
  password: 'teste123'
};

let authToken = '';

// Função para fazer requests
function request(method, path, data = null, auth = true) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (auth && authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Função para fazer login
async function login() {
  console.log('\n🔐 TESTE 1: Login');
  console.log('─────────────────────────────────');

  try {
    const response = await request('POST', '/api/auth/login', TEST_USER, false);

    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      console.log('✅ Login bem-sucedido!');
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Token: ${authToken.substring(0, 30)}...`);
      return true;
    } else {
      console.log('❌ Login falhou!');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.message);
    return false;
  }
}

// Testar Objetivos
async function testGoals() {
  console.log('\n📋 TESTE 2: Objetivos');
  console.log('─────────────────────────────────');

  try {
    // Buscar objetivos
    const response = await request('GET', '/api/goals');

    if (response.status === 200) {
      console.log(`✅ Objetivos carregados: ${response.data.goals?.length || 0} objetivos`);

      // Mostrar objetivos
      if (response.data.goals && response.data.goals.length > 0) {
        console.log('\n   Objetivos encontrados:');
        response.data.goals.forEach((goal, idx) => {
          console.log(`   ${idx + 1}. ${goal.title}`);
          console.log(`      Status: ${goal.status || 'active'}`);
          if (goal.is_nlp_complete) {
            console.log(`      Tipo: NLP Completo ✨`);
          }
        });
      }

      return true;
    } else {
      console.log('❌ Falha ao buscar objetivos');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar objetivos:', error.message);
    return false;
  }
}

// Testar Analytics
async function testAnalytics() {
  console.log('\n📊 TESTE 3: Analytics');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/analytics');

    if (response.status === 200) {
      const data = response.data;
      console.log('✅ Analytics carregados!');

      if (data.level) {
        console.log(`   Nível: ${data.level.level}`);
        console.log(`   XP Atual: ${data.level.current_xp}`);
        console.log(`   XP Próximo Nível: ${data.level.xp_to_next_level}`);
      }

      if (data.general) {
        console.log(`   Quests Completadas: ${data.general.total_quests_completed || 0}`);
        console.log(`   XP Total Ganho: ${data.general.total_xp_earned || 0}`);
      }

      return true;
    } else {
      console.log('❌ Falha ao buscar analytics');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar analytics:', error.message);
    return false;
  }
}

// Testar Reports
async function testReports() {
  console.log('\n📄 TESTE 4: Relatórios');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/reports?period=week');

    if (response.status === 200) {
      console.log('✅ Relatório semanal gerado!');

      if (response.data.report) {
        const lines = response.data.report.split('\n').slice(0, 10);
        console.log('\n   Primeiras linhas do relatório:');
        lines.forEach(line => console.log(`   ${line}`));
      }

      return true;
    } else {
      console.log('❌ Falha ao gerar relatório');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao gerar relatório:', error.message);
    return false;
  }
}

// Testar Achievements
async function testAchievements() {
  console.log('\n🏆 TESTE 5: Achievements');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/achievements');

    if (response.status === 200) {
      console.log(`✅ Achievements carregados: ${response.data.achievements?.length || 0}`);

      if (response.data.achievements) {
        const unlocked = response.data.achievements.filter(a => a.unlocked).length;
        console.log(`   Desbloqueados: ${unlocked}/${response.data.achievements.length}`);
      }

      return true;
    } else {
      console.log('❌ Falha ao buscar achievements');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar achievements:', error.message);
    return false;
  }
}

// Testar Coach
async function testCoach() {
  console.log('\n🤖 TESTE 6: Coach AI');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/chat');

    if (response.status === 200) {
      console.log('✅ Coach funcionando!');
      console.log(`   Mensagens: ${response.data.messages?.length || 0}`);

      return true;
    } else {
      console.log('❌ Falha no Coach');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro no Coach:', error.message);
    return false;
  }
}

// Testar Reminders
async function testReminders() {
  console.log('\n⏰ TESTE 7: Lembretes');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/reminders');

    if (response.status === 200) {
      console.log('✅ Lembretes carregados!');
      console.log(`   Lembretes: ${response.data.reminders?.length || 0}`);

      return true;
    } else {
      console.log('❌ Falha ao buscar lembretes');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar lembretes:', error.message);
    return false;
  }
}

// Main
async function main() {
  console.log('\n🚀 GOALSGUILD COACH - TESTE MANUAL COMPLETO');
  console.log('═══════════════════════════════════════════');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Usuário: ${TEST_USER.email}`);

  let results = [];

  // Executar testes
  results.push(await login());
  results.push(await testGoals());
  results.push(await testAnalytics());
  results.push(await testReports());
  results.push(await testAchievements());
  results.push(await testCoach());
  results.push(await testReminders());

  // Resumo
  console.log('\n\n═══════════════════════════════════════════');
  console.log('📊 RESUMO DO TESTE MANUAL');
  console.log('═══════════════════════════════════════════');

  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(0);

  console.log(`\nTestes Passando: ${passed}/${total} (${percentage}%)`);
  console.log(`\nStatus: ${passed === total ? '✅ TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}`);

  if (passed === total) {
    console.log('\n🎉 SISTEMA 100% FUNCIONAL!');
    console.log('   Pronto para produção! 🚀');
  } else {
    console.log('\n⚠️ Sistema precisa de ajustes.');
  }

  console.log('\n═══════════════════════════════════════════\n');
}

// Executar
main().catch(console.error);
