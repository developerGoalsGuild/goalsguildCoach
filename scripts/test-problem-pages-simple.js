const http = require('http');

function testPage(page, url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          // Tentar extrair erro
          const errorMatch = data.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
          if (errorMatch) {
            const errorMsg = errorMatch[1].replace(/<[^>]+>/g, '').trim();
            resolve({
              page,
              status: res.statusCode,
              error: errorMsg.substring(0, 200)
            });
          } else {
            resolve({
              page,
              status: res.statusCode,
              error: res.statusMessage
            });
          }
        } else {
          resolve({ page, status: 200, error: null });
        }
      });
    }).on('error', (err) => {
      resolve({ page, status: 'ERROR', error: err.message });
    });
  });
}

async function main() {
  console.log('⏳ Testando páginas problemáticas...\n');
  
  const pages = ['/daily', '/analytics', '/reports', '/achievements', '/insights'];
  const results = [];
  
  for (const page of pages) {
    const url = 'http://localhost:3002' + page;
    console.log('🔍 Testando ' + page + '...');
    
    const result = await testPage(page, url);
    results.push(result);
    
    if (result.error) {
      console.log('   ❌ ' + result.status + ': ' + result.error + '\n');
    } else {
      console.log('   ✅ ' + result.status + '\n');
    }
  }
  
  const errors = results.filter(r => r.error);
  
  if (errors.length > 0) {
    console.log('\n❌ ENCONTRADOS ERROS EM ' + errors.length + ' PÁGINAS:\n');
    
    errors.forEach(err => {
      console.log('📄 ' + err.page);
      console.log('   ' + err.error + '\n');
    });
  } else {
    console.log('\n✅ TODAS AS PÁGINAS ESTÃO OK!\n');
  }
  
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
