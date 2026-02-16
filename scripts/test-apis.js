const http = require('http');

console.log('⏳ Testando APIs problemáticas...\n');

const apis = [
  { name: 'Analytics', url: 'http://localhost:3002/api/analytics' },
  { name: 'Reports', url: 'http://localhost:3002/api/reports' },
  { name: 'Achievements', url: 'http://localhost:3002/api/achievements' },
  { name: 'Insights', url: 'http://localhost:3002/api/insights' },
  { name: 'Daily Summary', url: 'http://localhost:3002/api/daily-summary' }
];

const results = [];

async function testAPIs() {
  for (const api of apis) {
    console.log(`🔍 Testando ${api.name}...`);
    
    try {
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const status = response.status;
      const text = await response.text();
      
      if (status === 200) {
        console.log(`   ✅ ${status} OK\n`);
        results.push({ api: api.name, status: 200, error: null });
      } else if (status === 401) {
        console.log(`   ⚠️  401 Unauthorized (precisa de login)\n`);
        results.push({ api: api.name, status: 401, error: 'Unauthorized' });
      } else if (status === 500) {
        console.log(`   ❌ ${status} Internal Server Error\n`);
        console.log(`   📄 Primeiros 200 chars da resposta:\n`);
        console.log(`   ${text.substring(0, 200)}\n`);
        results.push({ api: api.name, status: 500, error: 'Internal Server Error' });
      } else {
        console.log(`   ⚠️  ${status} ${statusText}\n`);
        results.push({ api: api.name, status, error: statusText });
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}\n`);
      results.push({ api: api.name, status: 'ERROR', error: error.message });
    }
  }
  
  // Resumo
  console.log('\n📊 RESUMO:\n');
  const working = results.filter(r => r.status === 200);
  const needAuth = results.filter(r => r.status === 401);
  const errors = results.filter(r => r.status === 500 || r.status === 'ERROR');
  
  console.log(`✅ Funcionando: ${working.length}`);
  console.log(`🔒 Precisa auth: ${needAuth.length}`);
  console.log(`❌ Com erro: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\n❌ APIs COM ERRO:\n');
    errors.forEach(e => {
      console.log(`   ${e.api}: ${e.status}`);
      if (e.error) {
        console.log(`      ${e.error}`);
      }
    });
  }
}

testAPIs();
