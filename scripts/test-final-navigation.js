const fs = require('fs');

console.log('⏳ Testando navegação em todas as páginas...\n');

const pages = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/register', name: 'Register' },
  { path: '/quests', name: 'Quests' },
  { path: '/tasks', name: 'Tasks' },
  { path: '/coach', name: 'Coach' },
  { path: '/objectives', name: 'Objectives' },
  { path: '/daily', name: 'Daily Check-in' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reports', name: 'Reports' },
  { path: '/achievements', name: 'Achievements' },
  { path: '/insights', name: 'Insights' }
];

const results = [];

async function testPages() {
  for (const page of pages) {
    const url = `http://localhost:3002${page.path}`;
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      
      results.push({
        path: page.path,
        name: page.name,
        status: response.status,
        ok: response.ok
      });
      
      const icon = response.ok ? '✅' : '❌';
      const status = response.status === 404 ? '404' : response.status;
      console.log(`${icon} ${page.name.padEnd(20)} ${status}`);
      
    } catch (error) {
      results.push({
        path: page.path,
        name: page.name,
        status: 'ERROR',
        ok: false,
        error: error.message
      });
      
      console.log(`⚠️  ${page.name.padEnd(20)} ${error.message.substring(0, 50)}`);
    }
  }
  
  // Resumo
  const ok = results.filter(r => r.ok).length;
  const errors = results.filter(r => !r.ok).length;
  
  console.log('\n📊 RESUMO:');
  console.log(`✅ Páginas funcionando: ${ok}/${results.length}`);
  console.log(`❌ Páginas com erro: ${errors}/${results.length}\n`);
  
  // Salvar resultados
  fs.writeFileSync(
    'final-navigation-test.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  
  console.log('💾 Resultados salvos em final-navigation-test.json');
  
  // Exit com código de erro se houver falhas
  process.exit(errors > 0 ? 1 : 0);
}

testPages();
