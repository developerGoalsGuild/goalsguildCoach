const fs = require('fs');
const path = require('path');

const appFiles = [
  'app/page.js',
  'app/quests/page.js',
  'app/tasks/page.js',
  'app/coach/page.js',
  'app/objectives/page.js',
  'app/daily/page.js',
  'app/reports/page.js',
  'app/analytics/page.js',
  'app/achievements/page.js',
  'app/insights/page.js',
  'app/home/page.js',
  'app/login/page.js',
  'app/register/page.js'
];

console.log('⏳ Verificando erros de sintaxe comuns...\n');

const syntaxErrors = [];

appFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const lineNum = index + 1;
        
        // Verificar falta de vírgulas em style objects
        if (line.includes('style={{') && line.includes(': ') && !line.includes(',')) {
          // Verificar se há múltiplas props sem vírgula
          const props = line.match(/(\w+):\s*['"][^'"]*['"]/g);
          if (props && props.length > 1 && !line.includes('...')) {
            syntaxErrors.push({
              file,
              line: lineNum,
              text: line.trim().substring(0, 100),
              issue: 'Possível falta de vírgula em style object'
            });
          }
        }
      });
    }
  } catch (error) {
    console.log(`❌ Erro ao ler ${file}: ${error.message}`);
  }
});

if (syntaxErrors.length > 0) {
  console.log('⚠️  POSSÍVEIS ERROS DE SINTAXE ENCONTRADOS:\n');
  syntaxErrors.forEach(err => {
    console.log(`📄 ${err.file}:${err.line}`);
    console.log(`   ${err.text}`);
    console.log(`   ⚠️  ${err.issue}\n`);
  });
} else {
  console.log('✅ Nenhum erro de sintaxe encontrado!\n');
}

console.log('🔍 Verificando arquivos com problemas de import...\n');

const apiFiles = [
  'app/api/achievements/route.js',
  'app/api/analytics/route.js',
  'app/api/chat/route.js',
  'app/api/insights/route.js',
  'app/api/notifications/route.js',
  'app/api/objectives/[id]/route.js',
  'app/api/quests/route.js',
  'app/api/tasks/route.js',
  'app/api/reports/route.js',
  'app/api/weekly-review/route.js',
  'app/api/auth/login/route.js',
  'app/api/auth/register/route.js'
];

const importErrors = [];

apiFiles.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes("from '../../../lib/'") || line.includes("from '../../lib/'")) {
          const depth = (file.match(/\//g) || []).length - 2; // Aproximado
          if (file.includes('api/')) {
            const expectedDepth = '../../';
            if (!line.includes(expectedDepth) && !line.includes('../../../')) {
              importErrors.push({
                file,
                line: index + 1,
                text: line.trim(),
                issue: 'Possível erro de profundidade de import'
              });
            }
          }
        }
      });
    }
  } catch (error) {
    console.log(`❌ Erro ao ler ${file}: ${error.message}`);
  }
});

if (importErrors.length > 0) {
  console.log('⚠️  POSSÍVEIS ERROS DE IMPORT:\n');
  importErrors.forEach(err => {
    console.log(`📄 ${err.file}:${err.line}`);
    console.log(`   ${err.text}`);
    console.log(`   ⚠️  ${err.issue}\n`);
  });
} else {
  console.log('✅ Nenhum erro de import encontrado!\n');
}

console.log('📊 RESUMO:\n');
console.log(`✅ Arquivos de páginas verificados: ${appFiles.length}`);
console.log(`✅ Arquivos de API verificados: ${apiFiles.length}`);
console.log(`⚠️  Possíveis erros de sintaxe: ${syntaxErrors.length}`);
console.log(`⚠️  Possíveis erros de import: ${importErrors.length}`);
