const fs = require('fs');

console.log('⏳ Testando navegação nas páginas...\n');

const pages = [
  '/',
  '/login',
  '/register',
  '/home',
  '/quests',
  '/tasks',
  '/coach',
  '/objectives',
  '/daily',
  '/analytics',
  '/reports',
  '/achievements',
  '/insights'
];

const baseUrl = 'http://localhost:3002';
const results = [];

async function testPages() {
  for (const page of pages) {
    const url = `${baseUrl}${page}`;
    
    try {
      const start = Date.now();
      const response = await fetch(url);
      const duration = Date.now() - start;
      
      if (response.ok) {
        results.push({ page, status: response.status, duration, error: null });
        console.log(`✅ ${page.padEnd(20)} ${response.status} ${duration}ms`);
      } else {
        results.push({ page, status: response.status, duration, error: response.statusText });
        console.log(`❌ ${page.padEnd(20)} ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      results.push({ page, status: 'ERROR', duration: 0, error: error.message });
      console.log(`⚠️  ${page.padEnd(20)} ${error.message}`);
    }
  }
  
  console.log('\n📊 RESUMO:\n');
  console.log(`Total de páginas: ${pages.length}`);
  console.log(`Páginas OK: ${results.filter(r => !r.error && r.status === 200).length}`);
  console.log(`Páginas com erro: ${results.filter(r => r.error || r.status !== 200).length}`);
  
  // Salvar resultados
  fs.writeFileSync(
    'navigation-test-results.json',
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('\n💾 Resultados salvos em navigation-test-results.json');
}

testPages();
