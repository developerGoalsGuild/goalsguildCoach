const fs = require('fs');

const pages = [
  { file: 'app/analytics/page.js', url: '/analytics' },
  { file: 'app/reports/page.js', url: '/reports' },
  { file: 'app/achievements/page.js', url: '/achievements' },
  { file: 'app/insights/page.js', url: '/insights' },
  { file: 'app/daily/page.js', url: '/daily' }
];

console.log('⏳ Verificando sintaxe JavaScript dos arquivos problemáticos...\n');

const { execSync } = require('child_process');

pages.forEach(({ file, url }) => {
  console.log(`🔍 ${file}:`);
  
  try {
    // Tentar fazer parse do arquivo
    const result = execSync(`node -c ${file} 2>&1`, { encoding: 'utf8' });
    
    if (result.trim()) {
      console.log(`   ❌ Erro de sintaxe:`);
      console.log(`   ${result.trim().split('\n').join('\n   ')}\n`);
    } else {
      console.log(`   ✅ Sintaxe OK\n`);
    }
  } catch (error) {
    console.log(`   ❌ Erro ao verificar: ${error.message}\n`);
  }
});
