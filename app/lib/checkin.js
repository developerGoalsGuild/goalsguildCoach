// Função para gerar perguntas de check-in baseadas no contexto do objetivo

export function generateCheckInQuestions(objective) {
  const questions = [];
  
  // Perguntas baseadas no estágio/timeline
  if (objective.timeline_start) {
    const startDate = new Date(objective.timeline_start);
    const now = new Date();
    
    if (now < startDate) {
      questions.push("Seu objetivo ainda não começou. O que você precisa fazer para começar?");
      questions.push("Quando você vai dar o primeiro passo?");
    } else {
      const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceStart < 7) {
        questions.push("Como está sendo a primeira semana?");
        questions.push("O que tem sido fácil? O que tem sido desafiador?");
      } else if (daysSinceStart < 30) {
        questions.push(`Você está há ${daysSinceStart} dias nessa jornada. O que mudou desde que começou?`);
        questions.push("Você está no ritmo que esperava?");
      } else {
        questions.push(`Há ${daysSinceStart} dias! Impressionante. O que você aprendeu sobre si mesmo nesse período?`);
        questions.push("Qual foi o maior obstáculo até agora? Como você superou?");
      }
    }
  }

  // Perguntas baseadas em recursos
  if (objective.resources_internal && objective.resources_internal.length > 0) {
    questions.push(`Como estão seus recursos internos (${objective.resources_internal.slice(0, 2).join(', ')})?`);
  }

  if (objective.resources_external && objective.resources_external.length > 0) {
    questions.push(`Você conseguiu/acessou: ${objective.resources_external.join(', ')}?`);
  }

  // Perguntas baseadas na evidência
  if (objective.evidence_i_will_know) {
    questions.push(`O que você já pode ver que indica progresso em direção a: "${objective.evidence_i_will_know}"?`);
  }

  // Perguntas ecológicas
  if (objective.ecology_family_impact || objective.ecology_health_impact) {
    questions.push("Como esse objetivo está afetando sua vida hoje? Família? Saúde?");
  }

  // Perguntas baseadas na motivação
  if (objective.compelling_factor) {
    questions.push(`Lembra do "${objective.compelling_factor}"? Ainda puxa você?`);
  }

  // Perguntas de ação
  questions.push("Qual foi sua maior vitória desde o último check-in?");
  questions.push("O que você pode fazer hoje para avançar?");
  questions.push("O que está te segurando agora? Como podemos resolver?");

  // Retornar 2-3 perguntas aleatórias
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

// Função para atualizar próximo check-in
export function calculateNextCheckIn(currentDate, frequency) {
  const next = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(9, 0, 0, 0);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      next.setHours(9, 0, 0, 0);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      next.setHours(9, 0, 0, 0);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

// Função para gerar mensagem de check-in
export function generateCheckInMessage(objective, questions) {
  const greeting = getRandomGreeting();
  const randomQuestions = questions;
  
  return `${greeting}! 

Estou aqui para seu check-in sobre: **${objective.statement}**

${randomQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Responde no seu tempo. Estou torcendo por você! 🚀`;
}

function getRandomGreeting() {
  const greetings = [
    "Oi! Tudo bem?",
    "Fala! Como vai?",
    "E aí, beleza?",
    "Hey! Sumiu?"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}
