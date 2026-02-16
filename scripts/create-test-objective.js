// Criar objetivo NLP Well-Formed para o usuário de teste
const http = require('http');

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDJmMmIzZS0xOTU3LTQxODMtOGYxMy0xMmJjNTlkMTgwZjYiLCJlbWFpbCI6InRlc3RlQGdvYWxzZ3VpbGQuY29tIiwiaWF0IjoxNzcwOTc0NjY3LCJleHAiOjE3NzM1NjY2Njd9.dSvyByb4aDR9GDGTMKZsFmZ7V6HmX24_-40D2VZUBgQ';

const objective = {
  statement: "Quero atingir nível B1 de inglês em 6 meses, estudando 1 hora por dia, 5 dias por semana",
  context_when: "De segunda a sexta, das 19h às 20h",
  context_where: "Em casa, no meu escritório",
  context_who: "Eu sozinho, usando aplicativos e materiais online",
  sensory_visual: "Vendo mim mesmo assistindo videos em inglês sem legendas e lendo artigos tecnicos fluentemente",
  sensory_auditory: "Ouvindo podcasts em inglês e entendendo tudo",
  sensory_kinesthetic: "Me sentindo confiante ao falar em inglês",
  compelling_factor: "Quero me tornar elegivel para promocoes no trabalho que requerem ingles",
  ecology_family_impact: "Menos tempo com a familia nos dias de semana",
  ecology_family_resolution: "Compensar com tempo de qualidade nos fins de semana",
  ecology_health_impact: "Possivel estresse mental com estudo intensivo",
  ecology_health_resolution: "Incluir pausas de 10 minutos a cada hora de estudo",
  ecology_finance_impact: "Investimento em cursos e materiais",
  ecology_finance_resolution: "Usar recursos gratuitos primeiro, investir gradualmente",
  ecology_other: "Nenhum outro impacto negativo identificado",
  self_initiated_control: "Controle total sobre meu horario de estudo",
  self_initiated_not_in_control: "Dependencia de materiais online e conexao",
  resources_internal: "Disciplina, motivacao, tempo disponivel, experiencia previa com idiomas",
  resources_external: "Duolingo, YouTube, artigos online, aplicativos de flashcards, cursos gratuitos",
  evidence_i_will_know: "Saberei que consegui quando completar um curso B1 e passar em um teste de nivelamento B1",
  evidence_others_will_see: "Outros verao mim assistindo conteudos em ingles sem legendas e conversando com estrangeiros",
  evidence_metrics: "Completar 120 horas de estudo (1h/dia x 5 dias/semana x 24 semanas), atingir nivel B1 em teste oficial",
  timeline_start: new Date().toISOString(),
  timeline_target: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  timeline_checkpoints: "1 mes: nivel A2 completo; 3 meses: 60 horas de estudo; 6 meses: nivel B1 atingido",
  coaching_notes: "Objetivo criado atraves de conversa com Coach AI. Usuario motivado e com recursos claros."
};

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/objectives',
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
        console.log('\n🎯 Objetivo NLP criado:');
        console.log('📝 Statement:', objective.statement);
        console.log('⏰ Timeline:', new Date(objective.timeline_start).toLocaleDateString('pt-BR'), '->', new Date(objective.timeline_target).toLocaleDateString('pt-BR'));
        console.log('📊 Checkpoints:', objective.timeline_checkpoints);
        console.log('✅ Evidence:', objective.evidence_i_will_know);
      } else if (result.error) {
        console.log('\n❌ Erro ao criar objetivo:', result.error);
      }
    } catch (e) {
      console.log('\n❌ Erro ao fazer parse:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Erro na requisição:', error.message);
});

req.write(JSON.stringify(objective));
req.end();
