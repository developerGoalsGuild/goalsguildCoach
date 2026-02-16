const fs = require('fs');
const path = require('path');

/**
 * Corrige erros comuns nos arquivos de teste
 */
function fixTestFile(filePath) {
  console.log(`\n🔧 Corrigindo: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  
  // 1. Corrigir expect.string containing → expect.stringContaining
  const before1 = content;
  content = content.replace(/expect\.string\s+containing\s+/g, 'expect.stringContaining(');
  if (content !== before1) {
    const count1 = (before1.match(/expect\.string\s+containing\s+/g) || []).length;
    console.log(`   ✅ Corrigidos ${count1} 'expect.string containing'`);
    changes += count1;
  }
  
  // 2. Corrigir import paths após migração
  const oldPaths = [
    '../../../app/lib/reports',
    '../../app/lib/reports',
    '../../../app/lib/db',
    '../../app/lib/db',
    '../../../app/lib/auth-helpers',
    '../../app/lib/auth-helpers',
  ];
  
  const newPaths = [
    '../../../../app/lib/reports',
    '../../../app/lib/reports',
    '../../../../app/lib/db',
    '../../../app/lib/db',
    '../../../../app/lib/auth-helpers',
    '../../../app/lib/auth-helpers',
  ];
  
  // 3. Remover @testing-library/react imports se existirem
  if (content.includes('@testing-library/react') && !fs.existsSync('node_modules/@testing-library/react')) {
    content = content.replace(
      /import\s*\{[^}]*\}\s*from\s*['"]@testing-library\/react['"];?\s*\n/g,
      ''
    );
    console.log(`   ✅ Removido @testing-library/react import`);
    changes++;
  }
  
  // 4. Fecher parênteses do stringContaining se necessário
  content = content.replace(
    /expect\.stringContaining\([^)]*$/gm,
    match => match + ')'
  );
  
  if (changes > 0) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`   💾 Salvo ${changes} correções`);
  } else {
    console.log(`   ✨ Nenhuma correção necessária`);
  }
}

/**
 * Corrige todos os testes recursivamente
 */
function fixAllTests(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      fixAllTests(filePath);
    } else if (file.endsWith('.test.js')) {
      try {
        fixTestFile(filePath);
      } catch (error) {
        console.error(`   ❌ Erro ao corrigir ${filePath}:`, error.message);
      }
    }
  }
}

// Executar
console.log('🔧 CORRIGINDO TESTES...\n');
fixAllTests('./__tests__');
console.log('\n✅ CONCLUÍDO!');
