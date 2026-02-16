const http = require('http');

console.log('⏳ Testando todas as páginas...\n');

const pages = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/coach', name: 'Coach' },
  { path: '/objectives', name: 'Objectives' },
  { path: '/quests', name: 'Quests' },
  { path: '/tasks', name: 'Tasks' },
  { path: '/daily', name: 'Daily Check-in' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reports', name: 'Reports' },
  { path: '/achievements', name: 'Achievements' },
  { path: '/insights', name: 'Insights' }
];

const results = [];

async function testPages() {
  for (const page of pages) {
    console.log(`🔍 Testando ${page.name}...`);
    
    try {
      const response = await fetch('http://localhost:3002' + page.path, {
        method: 'GET',
        redirect: 'manual'
      });
      
      const status = response.status;
      
      if (status === 200) {
        console.log(`   ✅ 200 OK\n`);
        results.push({ page: page.name, status: 200 });
      } else if (status === 302 || status === 307) {
        const location = response.headers.get('location');
        console.log(`   ⚠️  ${status} Redirect → ${location}\n`);
        results.push({ page: page.name, status, redirect: location });
      } else if (status === 404) {
        console.log(`   ❌ 404 Not Found\n`);
        results.push({ page: page.name, status: 404 });
      } else if (status === 500) {
        console.log(`   ❌ 500 Internal Server Error\n`);
        results.push({ page: page.name, status: 500 });
      } else {
        console.log(`   ⚠️  ${status}\n`);
        results.push({ page: page.name, status });
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
      results.push({ page: page.name, status: 'ERROR', error: error.message });
    }
  }
  
  // Resumo
  console.log('\n📊 RESUMO:\n');
  const success = results.filter(r => r.status === 200);
  const redirect = results.filter(r => r.status === 302 || r.status === 307);
  const notFound = results.filter(r => r.status === 404);
  const errors = results.filter(r => r.status === 500 || r.status === 'ERROR');
  
  console.log(`✅ Sucesso (200): ${success.length}`);
  console.log(`🔄 Redirect (30x): ${redirect.length}`);
  console.log(`❌ Not Found (404): ${notFound.length}`);
  console.log(`💀 Erro (500/ERROR): ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ PÁGINAS COM ERRO:\n');
    errors.forEach(e => {
      console.log(`   ${e.page}: ${e.status}`);
      if (e.error) {
        console.log(`      ${e.error}`);
      }
    });
  }
  
  if (redirect.length > 0) {
    console.log('\n🔄 REDIRECIONAMENTOS:\n');
    redirect.forEach(r => {
      console.log(`   ${r.page} → ${r.redirect}`);
    });
  }
  
  console.log('\n🎯 RESULTADO FINAL:\n');
  console.log(`   ${success.length} / ${results.length} páginas funcionando diretamente`);
  console.log(`   ${(success.length + redirect.length)} / ${results.length} páginas acessíveis (com redirect)`);
  
  const percentage = Math.round((success.length / results.length) * 100);
  console.log(`   ${percentage}% de sucesso`);
}

testPages();
