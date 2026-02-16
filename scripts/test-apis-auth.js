const fetch = require('node-fetch');

console.log('⏳ Testando APIs COM autenticação...\n');

// Fazer login primeiro para obter token
async function login() {
  console.log('🔐 Fazendo login...\n');
  
  try {
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'teste@goalsguild.com',
        password: 'teste123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.token) {
      console.log('✅ Login bem-sucedido!\n');
      console.log('📧 Token:', data.token.substring(0, 50) + '...\n');
      return data.token;
    } else {
      console.log('❌ Falha no login\n');
      console.log('Resposta:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro no login:', error.message, '\n');
    return null;
  }
}

// Testar APIs com token
async function testAPIsWithToken(token) {
  const apis = [
    { name: 'Analytics', url: 'http://localhost:3002/api/analytics' },
    { name: 'Reports', url: 'http://localhost:3002/api/reports' },
    { name: 'Achievements', url: 'http://localhost:3002/api/achievements' },
    { name: 'Insights', url: 'http://localhost:3002/api/insights' },
    { name: 'Daily Summary', url: 'http://localhost:3002/api/daily-summary' }
  ];
  
  console.log('🔍 Testando APIs com token...\n');
  
  for (const api of apis) {
    console.log(`\n📊 ${api.name}:`);
    
    try {
      const response = await fetch(api.url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      const status = response.status;
      
      if (status === 200) {
        console.log(`   ✅ 200 OK`);
      } else if (status === 401) {
        console.log(`   ⚠️  401 Unauthorized`);
      } else if (status === 500) {
        console.log(`   ❌ 500 Internal Server Error`);
      } else {
        console.log(`   ⚠️  ${status}`);
      }
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
}

async function main() {
  const token = await login();
  
  if (token) {
    await testAPIsWithToken(token);
  } else {
    console.log('\n❌ Não foi possível obter token de autenticação');
  }
}

main();
