// Script para testar login e obter token JWT válido
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const postData = JSON.stringify({
  email: 'teste@goalsguild.com',
  password: 'teste123'
});

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const parsed = JSON.parse(data);
      if (parsed.token) {
        console.log('\n✅ Token JWT obtido com sucesso!');
        console.log('\nToken (primeiros 50 chars):', parsed.token.substring(0, 50) + '...');
        console.log('\nUser:', JSON.stringify(parsed.user, null, 2));
        console.log('\n\nPara testar o Coach, use este token no header Authorization:');
        console.log(`Authorization: Bearer ${parsed.token}`);
      } else if (parsed.error) {
        console.log('\n❌ Erro no login:', parsed.error);
      }
    } catch (e) {
      console.log('\n❌ Erro ao fazer parse da resposta:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
});

req.write(postData);
req.end();
