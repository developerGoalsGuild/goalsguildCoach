const fs = require('fs');
const path = require('path');

// Lista de arquivos para corrigir
const files = [
  'app/api/achievements/route.js',
  'app/api/analytics/route.js',
  'app/api/coach/nlp-goal/route.js',
  'app/api/daily-summary/route.js',
  'app/api/insights/route.js',
  'app/api/milestones/[id]/route.js',
  'app/api/notifications/route.js',
  'app/api/objectives/[id]/memory/route.js',
  'app/api/objectives/[id]/route.js',
  'app/api/quests/[id]/route.js',
  'app/api/quests/from-objective/route.js',
  'app/api/quests/route.js',
  'app/api/reminders/route.js',
  'app/api/reports/route.js',
  'app/api/tasks/[id]/route.js',
  'app/api/tasks/route.js',
  'app/api/weekly-review/route.js'
];

console.log('⏳ Corrigindo imports...\n');

let fixedCount = 0;

files.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Corrigir '../../../lib/db' para '../../lib/db'
      const before = content;
      content = content.replace(/\.\.\/\.\.\/\.\.\/lib\/db/g, '../../lib/db');
      
      // Corrigir '../../../lib/auth-helpers' se existir
      content = content.replace(/\.\.\/\.\.\/\.\.\/lib\/auth-helpers/g, '../../lib/auth-helpers');
      
      // Corrigir '../../../lib/' outros
      content = content.replace(/\.\.\/\.\.\/\.\.\/lib\//g, '../../lib/');
      
      if (content !== before) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}`);
        fixedCount++;
      } else {
        console.log(`⚪ ${file} (já OK)`);
      }
    } else {
      console.log(`❌ ${file} (não existe)`);
    }
  } catch (error) {
    console.log(`❌ ${file} (erro: ${error.message})`);
  }
});

console.log(`\n✅ ${fixedCount} arquivos corrigidos!`);
