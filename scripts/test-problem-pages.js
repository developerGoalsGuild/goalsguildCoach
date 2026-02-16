async function testPage(page, url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        page,
        status: response.status,
        error: response.statusText
      };
    }
    
    const text = await response.text();
    
    // Tentar extrair mensagem de erro do HTML
    const errorMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
    if (errorMatch) {
      const errorMsg = errorMatch[1].replace(/<[^>]+>/g, '').trim();
      return {
        page,
        status: 500,
        error: errorMsg.substring(0, 300)
      };
    }
    
    return { page, status: 200, error: null };
  } catch (error) {
    return { page, status: 'ERROR', error: error.message };
  }
}

async function testProblemPages() {
  console.log('⏳ Testando páginas problemáticas...\n');
  
  const pages = [
    '/daily',
    '/analytics',
    '/reports',
    '/achievements',
    '/insights'
  ];
  
  const results = [];
  
  for (const page of pages) {
    const url = \`http://localhost:3002\${page}\`;
    console.log(\`🔍 Testando \${page}...\`);
    
    const result = await testPage(page, url);
    results.push(result);
    
    if (result.error) {
      console.log(\`   ❌ \${result.status}: \${result.error}\n\`);
    } else {
      console.log(\`   ✅ \${result.status}\n\`);
    }
  }
  
  return results;
}

testProblemPages().then(results => {
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    console.log(\`\n❌ ENCONTRADOS ERROS EM \${errors.length} PÁGINAS:\n\`);
    
    errors.forEach(err => {
      console.log(\`📄 \${err.page}\`);
      console.log(\`   \${err.error}\n\`);
    });
  } else {
    console.log('\n✅ TODAS AS PÁGINAS ESTÃO OK!\n');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
});
