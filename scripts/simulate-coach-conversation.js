/**
 * Simula a conversa do Coach até salvar o objetivo
 *
 * Fluxo: 8 critérios NLP + Ecologia (renúncia + resolução de fricções) + Data de conclusão
 *
 * Uso: TEST_EMAIL=user@test.com TEST_PASSWORD=senha node scripts/simulate-coach-conversation.js
 * Ou: já logado no browser, execute e ele usará o contexto existente
 *
 * Nota: Planos de assinatura limitam objetivos/quests criados por IA (ex.: Free: 2 objetivos AI, 2 quests AI/mês).
 * Se o usuário atingir o limite, a API pode retornar 403 e a resposta do coach indicará upgrade.
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3002';

// Fluxo adaptado ao novo Coach: Ecologia (renúncia + fricções) e Data de conclusão obrigatórios
const CONVERSATION = [
  'eu quero correr 5 km',
  'eu quero viver uma vida saudável. eu imagino eu correndo 5 km direto sem parar, magro em forma e com energia',
  'eu me sinto feliz, satisfeito comigo mesmo por ter conseguido',
  'eu vou ter mais energia pra fazer coisas do dia a dia e serei mais saudavel. e terei mais energia para ficar com meus filhos',
  'vou ter que reduzir o tempo nas redes sociais e talvez algumas saídas aos sábados',
  'vou treinar de manhã cedo antes de todo mundo acordar, e combinar com minha esposa os dias fixos',
  'eu pretendo correr 3 vezes por semana',
  'na minha vizinhança de segunda, quinta, sábado',
  'sim os dois',
  'eu conseguirei correr 5km em 40 minutos',
  'em 8 semanas',
  'sim', // Salvar objetivo
  'sim', // Criar quest automática
];

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navegando para login...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });

    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (email && password) {
      console.log('2. Fazendo login...');
      await page.fill('input[type="email"], input[name="email"]', email);
      await page.fill('input[type="password"], input[name="password"]', password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/(?!login)/, { timeout: 10000 });
      await page.waitForTimeout(2000); // Garantir que token foi salvo no localStorage
    } else {
      console.log('2. Aguardando login manual (30s)...');
      console.log('   Defina TEST_EMAIL e TEST_PASSWORD para login automático.');
      await page.waitForURL(/\/(?!login)/, { timeout: 30000 });
    }

    console.log('3. Navegando para Coach...');
    await page.goto(`${BASE_URL}/coach`, { waitUntil: 'networkidle' });

    // Aguardar auth check e textarea aparecer (coach mostra "Verificando autenticação..." antes)
    const textarea = page.locator('textarea');
    await textarea.waitFor({ state: 'visible', timeout: 15000 });

    // Fechar dicas rápidas se aparecer
    const closeTips = page.locator('button:has-text("×")');
    if (await closeTips.isVisible()) {
      await closeTips.click();
    }

    const sendBtn = page.locator('button:has-text("Enviar"), button:has-text("→")');

    for (let i = 0; i < CONVERSATION.length; i++) {
      const msg = CONVERSATION[i];
      console.log(`4.${i + 1} Enviando: "${msg.substring(0, 40)}${msg.length > 40 ? '...' : ''}"`);

      await textarea.fill(msg);
      await sendBtn.click();

      // Aguardar resposta do coach (não mais "Digitando...")
      await page.waitForTimeout(2000);
      const loading = page.locator('text=Digitando...');
      await loading.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

      // Pequena pausa entre mensagens
      await page.waitForTimeout(1500);
    }

    console.log('5. Conversa simulada. Verificando se objetivo foi salvo...');
    await page.waitForTimeout(4000);

    const pageContent = await page.content();
    if (pageContent.includes('limit') && (pageContent.includes('Upgrade') || pageContent.includes('limit'))) {
      console.log('⚠️ Limite de assinatura atingido (objetivos ou quests por IA). Faça upgrade do plano.');
    } else if (pageContent.includes('Quest criada com sucesso')) {
      console.log('✅ Objetivo salvo e quest criada com sucesso!');
    } else if (pageContent.includes('Objetivo NLP salvo com sucesso') || pageContent.includes('Objetivo salvo')) {
      console.log('✅ Objetivo salvo com sucesso!');
    } else if (pageContent.includes('objective_memories') || pageContent.includes('erro ao salvar a memória')) {
      console.log('⚠️ Objetivo salvo, mas houve erro na memória (objective_memories).');
    } else if (pageContent.includes('Objectives') || pageContent.includes('Objectives')) {
      console.log('✅ Objetivo salvo! (Confira na aba Objectives)');
    } else {
      console.log('✅ Conversa concluída. Verifique a tela para confirmar o resultado.');
    }

    console.log('Mantendo o browser aberto por 10 segundos...');
    await page.waitForTimeout(10000);
  } catch (err) {
    console.error('Erro:', err.message);
  } finally {
    await browser.close();
  }
}

run();
