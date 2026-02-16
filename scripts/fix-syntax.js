const fs = require('fs');
const path = require('path');

const files = [
  'app/tasks/page.js',
  'app/coach/page.js',
  'app/objectives/page.js',
  'app/daily/page.js',
  'app/reports/page.js',
  'app/analytics/page.js',
  'app/achievements/page.js',
  'app/insights/page.js'
];

console.log('⏳ Corrigindo erros de sintaxe...\n');

let fixedCount = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Corrigir falta de vírgula após paddingTop
      const before = content;
      content = content.replace(
        /paddingTop: '60px' background: '#0a0a0a'/g,
        "paddingTop: '60px', background: '#0a0a0a'"
      );
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}`);
        fixedCount++;
      }
    }
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n✅ ${fixedCount} arquivos corrigidos!`);
