const fs = require('fs');
const path = require('path');

const filesWithTopNavImport = [
  'app/achievements/page.js',
  'app/coach/page.js',
  'app/objectives/page.js',
  'app/analytics/page.js',
  'app/daily/page.js',
  'app/reports/page.js'
];

console.log('⏳ Corrigindo imports de TopNavigation...\n');

let fixedCount = 0;

filesWithTopNavImport.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Corrigir import de TopNavigation
      const before = content;
      content = content.replace(
        /import TopNavigation from '\.\.\/\.\.\/components\/TopNavigation'/g,
        "import TopNavigation from '../components/TopNavigation'"
      );
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}`);
        fixedCount++;
      } else {
        console.log(`⚪️  ${file} (já OK)`);
      }
    }
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n✅ ${fixedCount} arquivos corrigidos!`);
