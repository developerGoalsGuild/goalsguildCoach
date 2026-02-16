const fs = require('fs');
const path = require('path');

const filesNeedingClientDirective = [
  'app/achievements/page.js',
  'app/analytics/page.js',
  'app/coach/page.js',
  'app/daily/page.js',
  'app/insights/page.js',
  'app/login/page.js',
  'app/objectives/page.js',
  'app/quests/page.js',
  'app/reports/page.js',
  'app/tasks/page.js',
  'app/page.js'
];

console.log('⏳ Adicionando diretiva "use client" onde necessário...\n');

let fixedCount = 0;

filesNeedingClientDirective.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Verificar se já tem 'use client'
      if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
        console.log(`⚪️  ${file} (já tem)`);
        return;
      }
      
      // Verificar se usa hooks do React
      if (!content.includes('useState') && !content.includes('useEffect')) {
        console.log(`⚪️  ${file} (não precisa)`);
        return;
      }
      
      // Adicionar 'use client' no início
      const lines = content.split('\n');
      
      // Encontrar a primeira linha não-comentária
      let firstNonCommentLine = 0;
      for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*')) {
          firstNonCommentLine = i;
          break;
        }
      }
      
      // Adicionar 'use client' antes do primeiro import
      if (lines[firstNonCommentLine].startsWith('import')) {
        lines.splice(firstNonCommentLine, 0, "'use client';\n");
        content = lines.join('\n');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`✅ ${file}`);
        fixedCount++;
      }
    }
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n✅ ${fixedCount} arquivos atualizados com 'use client'!`);
