// Criar objetivo simples para o usuário de teste
const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDJmMmIzZS0xOTU3LTQxODMtOGYxMy0xMmJjNTlkMTgwZjYiLCJlbWFpbCI6InRlc3RlQGdvYWxzZ3VpbGQuY29tIiwiaWF0IjoxNzcwOTc0NjY3LCJleHAiOjE3NzM1NjY2Njd9.dSvyByb4aDR9GDGTMKZsFmZ7V6HmX24_-40D2VZUBgQ';

const goal = {
  title: "Aprender Inglês - Nível B1 em 6 meses",
  description: "Estudar inglês 1 hora por dia, 5 dias por semana, durante 6 meses. Objetivo: atingir nível B1, conseguir ler artigos técnicos e assistir vídeos sem legendas.",
  target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/goals',
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
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ Objetivo criado com sucesso!');
        console.log('\n🎯 Objetivo Criado:');
        console.log('📝 Título:', goal.title);
        console.log('📄 Descrição:', goal.description);
        console.log('📅 Data Alvo:', new Date(goal.target_date).toLocaleDateString('pt-BR'));
        console.log('\n✅ Usuário de teste agora tem um objetivo de aprender inglês!');
      } else if (result.error) {
        console.log('\n❌ Erro ao criar objetivo:', result.error);
      }
    } catch (e) {
      console.log('\n❌ Erro ao fazer parse:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
});

req.write(JSON.stringify(goal));
req.end();
