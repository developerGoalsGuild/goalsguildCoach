const pages = ['/analytics', '/reports', '/achievements', '/insights', '/daily'];

console.log('⏳ Testando páginas problemáticas individualmente...\n');

async function testPages() {
  for (const page of pages) {
    const url = `http://localhost:3002${page}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html'
        }
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        console.log(`❌ ${page.padEnd(15)} ${response.status}`);
        
        // Tentar extrair mensagem de erro do HTML
        const errorMatch = text.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        if (errorMatch) {
          console.log(`   Erro: ${errorMatch[1].substring(0, 200)}...`);
        }
      } else {
        console.log(`✅ ${page.padEnd(15)} ${response.status}`);
      }
    } catch (error) {
      console.log(`⚠️  ${page.padEnd(15)} ${error.message}`);
    }
  }
}

testPages();
