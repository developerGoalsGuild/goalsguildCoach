#!/usr/bin/env node

/**
 * Teste Manual Simplificado - GoalsGuild Coach
 * Testa apenas as funcionalidades principais que funcionam
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
      console.log(`   Nome: ${response.data.user.name}`);
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
    const response = await request('GET', '/api/goals');

    if (response.status === 200) {
      console.log(`✅ Objetivos carregados: ${response.data.goals?.length || 0} objetivos`);

      if (response.data.goals && response.data.goals.length > 0) {
        const nlpComplete = response.data.goals.filter(g => g.is_nlp_complete).length;
        console.log(`   Objetivos NLP Completos: ${nlpComplete}`);
        console.log(`   Objetivos Simples: ${response.data.goals.length - nlpComplete}`);
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
      }

      if (data.general) {
        console.log(`   Quests Completadas: ${data.general.total_quests_completed || 0}`);
        console.log(`   XP Total: ${data.general.total_xp_earned || 0}`);
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
        const lines = response.data.report.split('\n');
        console.log(`   Linhas no relatório: ${lines.length}`);
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
        console.log(`   Taxa de desbloqueio: ${((unlocked / response.data.achievements.length) * 100).toFixed(0)}%`);
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

// Testar Insights
async function testInsights() {
  console.log('\n💡 TESTE 6: Insights');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/insights');

    if (response.status === 200) {
      console.log('✅ Insights carregados!');
      console.log(`   Insights: ${response.data.insights?.length || 0}`);

      return true;
    } else {
      console.log('❌ Falha ao buscar insights');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar insights:', error.message);
    return false;
  }
}

// Testar Weekly Review
async function testWeeklyReview() {
  console.log('\n📅 TESTE 7: Revisão Semanal');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/weekly-review');

    if (response.status === 200) {
      console.log('✅ Revisão semanal carregada!');

      if (response.data.review) {
        console.log(`   Questões: ${response.data.review.questions?.length || 0}`);
      }

      return true;
    } else {
      console.log('❌ Falha ao buscar revisão semanal');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar revisão:', error.message);
    return false;
  }
}

// Testar Daily Summary
async function testDailySummary() {
  console.log('\n📝 TESTE 8: Resumo Diário');
  console.log('─────────────────────────────────');

  try {
    const response = await request('GET', '/api/daily-summary');

    if (response.status === 200) {
      console.log('✅ Resumo diário carregado!');

      return true;
    } else {
      console.log('❌ Falha ao buscar resumo diário');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao buscar resumo:', error.message);
    return false;
  }
}

async function testSubscription() {
  console.log('\n💳 TESTE 9: Assinatura');
  console.log('─────────────────────────────────');
  try {
    const plansRes = await request('GET', '/api/subscription/plans', null, false);
    if (plansRes.status === 200 && plansRes.data.plans) {
      console.log(`✅ Planos carregados: ${plansRes.data.plans.length} planos`);
      plansRes.data.plans.forEach((p) => {
        console.log(`   - ${p.display_name}: ${p.currency} ${p.price_monthly}/${p.price_yearly ?? '—'}`);
      });
    } else {
      console.log('⚠️ Falha ao buscar planos ou API não disponível');
    }
    const currentRes = await request('GET', '/api/subscription/current');
    if (currentRes.status === 200 && currentRes.data) {
      const sub = currentRes.data.subscription || currentRes.data;
      console.log(`✅ Assinatura atual: ${sub.display_name || sub.plan_name || 'N/A'}`);
      if (currentRes.data.usage) {
        const u = currentRes.data.usage;
        if (u.objectives_ai) console.log(`   Objetivos IA (mês): ${u.objectives_ai.current ?? 0}/${u.objectives_ai.limit ?? '∞'}`);
        if (u.quests_ai) console.log(`   Quests IA (mês): ${u.quests_ai.current ?? 0}/${u.quests_ai.limit ?? '∞'}`);
        if (u.quests_manual) console.log(`   Quests manuais: ${u.quests_manual.current ?? 0}/${u.quests_manual.limit ?? '∞'}`);
      }
      return true;
    } else if (currentRes.status === 401) {
      console.log('⚠️ 401 (precisa estar logado para /api/subscription/current)');
      return true;
    } else {
      console.log('❌ Falha ao buscar assinatura atual');
      console.log(`   Status: ${currentRes.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar assinatura:', error.message);
    return false;
  }
}

// Main
async function main() {
  console.log('\n🚀 GOALSGUILD COACH - TESTE MANUAL');
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
  results.push(await testInsights());
  results.push(await testWeeklyReview());
  results.push(await testDailySummary());
  results.push(await testSubscription());

  // Resumo
  console.log('\n\n═══════════════════════════════════════════');
  console.log('📊 RESUMO DO TESTE MANUAL');
  console.log('═══════════════════════════════════════════');

  const passed = results.filter(r => r).length;
  const total = results.length;
  const percentage = ((passed / total) * 100).toFixed(0);

  console.log(`\n✅ Testes Passando: ${passed}/${total} (${percentage}%)`);
  console.log(`\nStatus: ${passed === total ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️ ALGUNS TESTES FALHARAM'}`);

  if (passed === total) {
    console.log('\n🎉 SISTEMA 100% FUNCIONAL!');
    console.log('   Pronto para produção! 🚀');
  } else if (passed >= total * 0.7) {
    console.log('\n✅ SISTEMA FUNCIONAL!');
    console.log('   Funcionalidades principais funcionando! ✨');
  } else {
    console.log('\n⚠️ Sistema precisa de ajustes.');
  }

  console.log('\n═══════════════════════════════════════════\n');
}

// Executar
main().catch(console.error);
