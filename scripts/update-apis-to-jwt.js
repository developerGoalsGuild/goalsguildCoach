const fs = require('fs');

const filesToFix = [
  'app/api/analytics/route.js',
  'app/api/reports/route.js',
  'app/api/achievements/route.js',
  'app/api/insights/route.js',
  'app/api/daily-summary/route.js'
];

console.log('⏳ Atualizando APIs para usar JWT...\n');

let fixedCount = 0;

filesToFix.forEach(file => {
  const fullPath = `./${file}`;
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    const before = content;
    
    // Verificar se já foi atualizado
    if (content.includes('getAuthToken')) {
      console.log(`⚪️  ${file} (já atualizado)`);
      return;
    }
    
    // Substituir verificação de session_id por JWT
    const oldAuthCheck = /const sessionId = request\.cookies\.get\('session_id'\)\?\.value;.*?\n\s*if \(!sessionId\) \{.*?\n\s*return NextResponse\.json\(\{ error: 'Unauthorized' \}, \{ status: 401 \}\);.*?\n\s*\}/;
    
    const newAuthCheck = `const { getAuthToken } = require('../../lib/auth');
  const token = getAuthToken(request);
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { verifyJWT } = require('../../lib/auth');
  const decoded = verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }`;
    
    // Substituir busca de session
    const oldSessionSearch = /\/\/ Buscar sessão do usuário\n\s*const sessionResult = await pool\.query\(\n\s*'SELECT id FROM sessions WHERE session_id = \$1',\n\s*\[sessionId\]\n\s*\);/;
    
    const newSessionSearch = `// Usar userId do token JWT`;
    
    if (oldAuthCheck.test(content) && oldSessionSearch.test(content)) {
      content = content.replace(oldAuthCheck, newAuthCheck);
      content = content.replace(oldSessionSearch, newSessionSearch);
      
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ ${file}`);
      fixedCount++;
    } else if (!content.includes('getAuthToken')) {
      console.log(`⚠️  ${file} (estrutura diferente)`);
    }
    
  } catch (error) {
    console.log(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n✅ ${fixedCount} arquivos atualizados!`);
