// Criar uma Quest para o usuário de teste
const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDJmMmIzZS0xOTU3LTQxODMtOGYxMy0xMmJjNTlkMTgwZjYiLCJlbWFpbCI6InRlc3RlQGdvYWxzZ3VpbGQuY29tIiwiaWF0IjoxNzcwOTc0NjY3LCJleHAiOjE3NzM1NjY2Njd9.dSvyByb4aDR9GDGTMKZsFmZ7V6HmX24_-40D2VZUBgQ';

const quest = {
  title: "Aprender Inglês - Nível B1",
  description: "Estudar inglês 1 hora por dia, 5 dias por semana, durante 6 meses. Meta: atingir nível B1 de proficiência.",
  difficulty: 'medium',
  quest_type: 'main',
  xp_reward: 500,
  start_date: new Date().toISOString(),
  target_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/quests',
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
    
    try {
      const result = JSON.parse(data);
      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log('\n✅ Quest criada com sucesso!');
        console.log('\n⚔️ Quest Criada:');
        console.log('📝 Título:', quest.title);
        console.log('📄 Descrição:', quest.description);
        console.log('📊 Dificuldade:', quest.difficulty);
        console.log('💎 XP Reward:', quest.xp_reward);
        console.log('📅 Data Alvo:', new Date(quest.target_date).toLocaleDateString('pt-BR'));
        console.log('\n✅ Usuário de teste agora tem uma quest de aprender inglês!');
        console.log('📊 Acesse /quests para ver a quest criada!');
      } else if (result.error) {
        console.log('\n❌ Erro ao criar quest:', result.error);
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

req.write(JSON.stringify(quest));
req.end();
