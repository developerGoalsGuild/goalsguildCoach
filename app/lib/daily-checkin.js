// Função para gerar perguntas de check-in diário

export function generateDailyCheckInQuestions(summary) {
  const questions = [];
  let questionIndex = 0;

  // 1. Como foi o dia (geral)
  if (summary.completed_tasks > 0 || summary.pending_tasks > 0) {
    questions.push(`Como você avalia seu dia? (Produto: ${summary.completed_tasks}/${summary.completed_tasks + summary.pending_tasks} tarefas)`);
  } else {
    questions.push("Como foi seu dia?");
  }

  // 2. Foco no que foi feito
  if (summary.completed_tasks > 0) {
    questions.push(`Quais foram suas 3 principais vitórias hoje?`);
  } else {
    questions.push("O que te impediu de ser mais produtivo hoje?");
  }

  // 3. Sentimentos/dificuldades
  questions.push("O que foi mais desafiador hoje?");
  questions.push("O que te surpreendeu positivamente?");

  // 4. Reflexão
  if (summary.active_objectives > 0) {
    questions.push(`Você deu algum passo em direção aos seus ${summary.active_objectives} objetivos hoje? Qual?`);
  }

  if (summary.total_xp > 0) {
    questions.push(`Você ganhou ${summary.total_xp} XP hoje! Como isso te faz sentir?`);
  }

  // 5. Amanhã
  questions.push("O que você quer conquistar amanhã?");
  questions.push("Como você pode ser ainda melhor amanhã do que foi hoje?");

  // 6. Gratidão (opcional mas boa)
  questions.push("Por que você é grato hoje?");

  // Retornar 3-5 perguntas aleatórias
  const shuffled = questions.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

// Função para gerar mensagem de check-in diário
export function generateDailyCheckInMessage(summary, questions) {
  const greeting = getRandomGreeting();
  const hour = new Date().getHours();
  
  let timeOfDay = '';
  if (hour < 12) timeOfDay = 'manhã';
  else if (hour < 18) timeOfDay = 'tarde';
  else timeOfDay = 'noite';

  let message = `${greeting}! Boa ${timeOfDay}! ☀

**Resumo do seu dia:**
${summary.completed_tasks > 0 ? `✅ Tarefas completadas: ${summary.completed_tasks}` : ''}
${summary.pending_tasks > 0 ? `⏳ Tarefas pendentes: ${summary.pending_tasks}` : ''}
${summary.total_xp > 0 ? `⭐ XP ganho: ${summary.total_xp}` : ''}
${summary.quests_completed > 0 ? `🎯 Quests completadas: ${summary.quests_completed}` : ''}
${summary.active_objectives > 0 ? `🎯 Objetivos ativos: ${summary.active_objectives}` : ''}

`;

  if (summary.hours_worked > 0) {
    message += `📊 Horas trabalhadas: ${summary.hours_worked.toFixed(1)}h\n`;
  }

  message += `
**Check-in de hoje:**
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Responde em poucas palavras. Estou curtindo! 🎯`;

  return message;
}

// Função para gerar resumo do final do dia
export function generateEndOfDayMessage(summary) {
  const hour = new Date().getHours();
  const isNight = hour >= 20 || hour < 6;

  if (!isNight) {
    return null; // Só gera resumo à noite
  }

  let message = `**🌙 Fim do dia!**

${summary.total_xp > 0 ? `⭐ **XP Total Hoje:** ${summary.total_xp}` : ''}
${summary.completed_tasks > 0 ? `✅ **Tarefas Completadas:** ${summary.completed_tasks}` : ''}
${summary.hours_worked > 0 ? `📊 **Horas Trabalhadas:** ${summary.hours_worked.toFixed(1)}h` : ''}

`;

  if (summary.completed_tasks === 0 && summary.pending_tasks > 0) {
    message += `\n\n⚠️ **Alerta:** ${summary.pending_tasks} tarefas pendentes. Amanhã é outro dia!`;
  } else if (summary.completed_tasks > 0) {
    message += `\n\n✨ **Produtividade:** Bom trabalho! ${summary.completed_tasks} tarefas completadas é muita coisa!`;
  }

  if (summary.total_xp >= 200) {
    message += `\n\n🎉 **Excelente:** ${summary.total_xp} XP hoje é top!`;
  }

  if (summary.active_objectives > 0) {
    message += `\n\n🎯 **Objetivos:** Você está trabalhando em ${summary.active_objectives} objetivos importantes. Continue assim!`;
  }

  message += `\n\n**Boa noite!** Descanse bem. Amanhã é um novo dia! 🌙`;

  return message;
}

function getRandomGreeting() {
  const greetings = [
    "Oi!", "Fala!", "E aí!", "Hey!", "Beleza?"
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
}

// Função para processar check-in diário
export function processDailyCheckIn(objective, summary) {
  const questions = generateDailyCheckInQuestions(summary);
  const message = generateDailyCheckInMessage(summary, questions);
  
  return {
    type: 'daily_checkin',
    message: message,
    questions: questions,
    timestamp: new Date().toISOString()
  };
}
