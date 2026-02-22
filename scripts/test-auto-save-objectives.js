/**
 * Teste de salvamento automático de objetivos pelo Coach
 */

const http = require('http');

const TOKEN = process.env.TEST_TOKEN;
if (!TOKEN) {
  console.error('Missing TEST_TOKEN. Set it in .env or run: TEST_TOKEN=<jwt> node scripts/test-auto-save-objectives.js');
  process.exit(1);
}

// Mensagens de teste
const testMessages = [
  { message: 'Quero aprender inglês', expected: true },
  { message: 'Meu objetivo é emagrecer 10kg', expected: true },
  { message: 'Oi, tudo bem?', expected: false }
];

async function testMessage(testMsg) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            message: testMsg.message,
            statusCode: res.statusCode,
            response: result,
            objectiveSaved: result.message && result.message.includes('Objetivo salvo')
          });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ message: testMsg.message }));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testando salvamento automático de objetivos...\n');

  for (const test of testMessages) {
    console.log(`📝 Mensagem: "${test.message}"`);
    console.log(`   Esperado: ${test.expected ? 'SALVAR' : 'NÃO SALVAR'}`);
    
    try {
      const result = await testMessage(test);
      console.log(`   Status: ${result.statusCode}`);
      console.log(`   Objetivo salvo: ${result.objectiveSaved ? '✅ SIM' : '❌ NÃO'}`);
      
      if (test.expected && result.objectiveSaved) {
        console.log('   ✅ PASSOU');
      } else if (!test.expected && !result.objectiveSaved) {
        console.log('   ✅ PASSOU');
      } else {
        console.log('   ⚠️  INESPERADO');
      }
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('\n✅ Testes concluídos!');
}

runTests();
