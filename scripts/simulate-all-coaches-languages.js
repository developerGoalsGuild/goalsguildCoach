#!/usr/bin/env node
/**
 * Simulates a short coach conversation for every predefined persona and language (pt-BR, en-US).
 */

try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
} catch (_) {}

/**
 * Verifies that each coach responds in the correct language and with persona-appropriate style.
 *
 * Usage:
 *   TEST_TOKEN=eyJ... node scripts/simulate-all-coaches-languages.js
 *   TEST_EMAIL=user@test.com TEST_PASSWORD=Senha123 node scripts/simulate-all-coaches-languages.js
 *
 * Requires: server running (e.g. npm run dev), valid test user, OPENAI_API_KEY for real LLM responses.
 */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

// Predefined personas: id, tone, specialization, archetype, theme (from app/lib/personas.js)
const PERSONAS = [
  { id: 'executive-coach', name: 'Executive Coach', tone: 'sharp', specialization: 'career', archetype: 'mentor', theme: 'executive-coach' },
  { id: 'wellness-coach', name: 'Wellness Coach', tone: 'gentle', specialization: 'fitness', archetype: 'therapist', theme: 'wellness-coach' },
  { id: 'productivity-expert', name: 'Productivity Expert', tone: 'sharp', specialization: 'productivity', archetype: 'mentor', theme: 'productivity-expert' },
  { id: 'motivational-speaker', name: 'Motivational Speaker', tone: 'warm', specialization: 'general', archetype: 'friend', theme: 'motivational-speaker' },
  { id: 'life-coach', name: 'Life Coach', tone: 'warm', specialization: 'general', archetype: 'therapist', theme: 'life-coach' },
  { id: 'fitness-trainer', name: 'Fitness Trainer', tone: 'aggressive', specialization: 'fitness', archetype: 'drill-instructor', theme: 'fitness-trainer' },
  { id: 'guild-master', name: 'Guild Master', tone: 'warm', specialization: 'general', archetype: 'mentor', theme: 'guild-master' },
  { id: 'tavern-keeper', name: 'Tavern Keeper', tone: 'warm', specialization: 'general', archetype: 'friend', theme: 'tavern-keeper' },
  { id: 'warrior-trainer', name: 'Warrior Trainer', tone: 'aggressive', specialization: 'fitness', archetype: 'drill-instructor', theme: 'warrior-trainer' },
  { id: 'wise-sage', name: 'Wise Sage', tone: 'gentle', specialization: 'general', archetype: 'therapist', theme: 'wise-sage' },
];

// Conversa completa até objetivo NLP + aprovação (ordem alinhada à prioridade do prompt: prazo, sensorial, contexto, recursos, evidência, motivador, ecologia x2, auto-iniciado, data)
const CONVERSATION_PT = [
  'Eu quero ganhar mais músculos e ter um físico mais definido.',
  'Em três meses.',
  'Me vejo com mais massa muscular, me sinto forte e confiante no espelho.',
  'Na academia, três vezes por semana, de manhã.',
  'Preciso de tempo para treinar e boa alimentação.',
  'Quando eu conseguir levantar mais peso e ver definição no espelho.',
  'Porque quero mais saúde e autoestima.',
  'Vou ter que reduzir tempo em redes sociais e acordar mais cedo.',
  'Vou treinar de manhã cedo e combinar com a família os dias fixos.',
  'Vou me comprometer a treinar 3x por semana.',
  'Em três meses.',
  'sim',
  'sim',
];

const CONVERSATION_EN = [
  'I want to gain more muscle and have a more defined physique.',
  'In three months.',
  'I see myself with more muscle, I feel strong and confident in the mirror.',
  'At the gym, three times a week, in the morning.',
  'I need time to train and good nutrition.',
  'When I can lift more weight and see definition in the mirror.',
  'Because I want better health and self-esteem.',
  'I will have to reduce time on social media and wake up earlier.',
  'I will train early morning and coordinate with family on fixed days.',
  'I will commit to training 3 times a week.',
  'In three months.',
  'yes',
  'yes',
];

const LOCALES = [
  { code: 'pt-BR', firstMessage: CONVERSATION_PT[0], conversation: CONVERSATION_PT },
  { code: 'en-US', firstMessage: CONVERSATION_EN[0], conversation: CONVERSATION_EN },
];

const MAX_MESSAGES = 25; // evita loop infinito
const SAVE_PATTERNS = [
  /deseja salvar este objetivo/i,
  /objetivo nlp completo/i,
  /save this objective/i,
  /nlp objective complete/i,
  /salvar este objetivo/i,
];
const PENDING_APPROVAL = 'pendingApproval';

let AUTH_TOKEN = process.env.TEST_TOKEN;

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Login failed: ${err.error || res.statusText}`);
  }
  const data = await res.json();
  return data.token;
}

async function setPersona(token, persona) {
  const res = await fetch(`${BASE_URL}/api/user/persona`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      tone: persona.tone,
      specialization: persona.specialization,
      archetype: persona.archetype,
      theme: persona.theme,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Set persona failed: ${err.error || res.statusText}`);
  }
}

async function sendChat(token, message, locale) {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ message, locale }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Chat failed: ${err.error || res.statusText}`);
  }
  return res.json();
}

function truncate(str, maxLen = 120) {
  if (!str || typeof str !== 'string') return '';
  const s = str.replace(/\s+/g, ' ').trim();
  return s.length <= maxLen ? s : s.slice(0, maxLen) + '…';
}

/** Detect off responses: wrong language, asks to rephrase, empty, etc. */
function analyzeOffResponses(results) {
  const rephrasePattern = /compartilhe o texto|reescrevesse|reformulasse|rephrase|envie o texto que|send.*text.*rephrase|text you want me to rewrite|text you'd like me to rewrite|text you would like me to rewrite|provide the text you want|share the text you'd like|drop the text you want|forgot to share the text|manda o texto que você quer que eu reescreva|texto que você quer que eu reescreva/i;
  const ptWord = /\b(quero|obrigado|você|como|para|sobre|isso|esse|essa|mais|sobre|tempo|objetivo|quest|ótimo|ótima|vamos|gostaria|entendi)\b/i;
  const enWord = /\b(you|your|want|goal|great|let's|how|about|this|that|time|thank|share|would|the|and|for|with)\b/i;

  const off = [];
  for (const r of results) {
    if (r.error) continue;
    const reply = (r.reply || '').trim();
    const issues = [];

    if (reply.length < 10) issues.push('reply_too_short');
    if (rephrasePattern.test(reply)) issues.push('asks_to_rephrase_or_rewrite');

    if (r.locale === 'pt-BR') {
      const enCount = (reply.match(enWord) || []).length;
      const ptCount = (reply.match(ptWord) || []).length;
      if (reply.length > 50 && enCount > ptCount) issues.push('likely_english_instead_of_portuguese');
    }
    if (r.locale === 'en-US') {
      const enCount = (reply.match(enWord) || []).length;
      const ptCount = (reply.match(ptWord) || []).length;
      if (reply.length > 50 && ptCount > enCount) issues.push('likely_portuguese_instead_of_english');
    }

    if (issues.length) off.push({ persona: r.persona, locale: r.locale, issues, replySnippet: truncate(reply, 150) });
  }
  return off;
}

function isObjectiveCompleteResponse(response) {
  if (response[PENDING_APPROVAL] === true) return true;
  const msg = (response.message || '').trim();
  return SAVE_PATTERNS.some((p) => p.test(msg));
}

async function runOneFull(token, persona, locale) {
  await setPersona(token, persona);
  const conversation = locale.conversation || [locale.firstMessage, 'sim', 'sim'];
  let lastReply = '';
  let objectiveSaved = false;
  let questCreated = false;
  let messageCount = 0;
  let i = 0;

  while (i < conversation.length && messageCount < MAX_MESSAGES) {
    const message = conversation[i];
    const res = await sendChat(token, message, locale.code);
    messageCount++;
    lastReply = res.message || '';

    if (isObjectiveCompleteResponse(res)) {
      const approval = locale.code === 'en-US' ? 'yes' : 'sim';
      const resSave = await sendChat(token, approval, locale.code);
      messageCount++;
      lastReply = resSave.message || '';
      if (/salvo|saved|objetivo salvo|objective saved|quest criada|quest created|milestones/i.test(lastReply)) {
        objectiveSaved = true;
        if (/quest criada|quest created|milestones/i.test(lastReply)) questCreated = true;
      }
      break;
    }
    i++;
  }

  return {
    reply: truncate(lastReply, 200),
    ok: true,
    objectiveSaved,
    questCreated,
    messageCount,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  let personaId = null;
  let localeCode = null;
  let analyzeFile = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--persona' && args[i + 1]) {
      personaId = args[++i];
    } else if (args[i] === '--locale' && args[i + 1]) {
      localeCode = args[++i];
    } else if (args[i] === '--analyze' && args[i + 1]) {
      analyzeFile = args[++i];
    }
  }
  return { personaId, localeCode, analyzeFile };
}

async function main() {
  const { analyzeFile } = parseArgs();
  if (analyzeFile) {
    await runAnalyzeOnly(analyzeFile);
    return;
  }

  if (!AUTH_TOKEN) {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (email && password) {
      console.log('Logging in with TEST_EMAIL / TEST_PASSWORD…');
      AUTH_TOKEN = await login(email, password);
    } else {
      console.error('Set TEST_TOKEN or TEST_EMAIL and TEST_PASSWORD.');
      process.exit(1);
    }
  }

  const { personaId, localeCode } = parseArgs();
  const personas = personaId
    ? PERSONAS.filter((p) => p.id === personaId || p.name.toLowerCase().includes(personaId.toLowerCase()))
    : PERSONAS;
  const locales = localeCode
    ? LOCALES.filter((l) => l.code === localeCode)
    : LOCALES;

  if (personas.length === 0) {
    console.error('No persona matched. Use --persona <id or name>.');
    process.exit(1);
  }
  if (locales.length === 0) {
    console.error('No locale matched. Use --locale pt-BR or --locale en-US.');
    process.exit(1);
  }

  console.log('\n=== Simulation: every coach × every language ===');
  console.log(`Personas: ${personas.map((p) => p.name).join(', ')}`);
  console.log(`Locales: ${locales.map((l) => l.code).join(', ')}\n`);
  const results = [];
  let failed = 0;

  for (const persona of personas) {
    for (const locale of locales) {
      const key = `${persona.name} (${locale.code})`;
      try {
        const out = await runOneFull(AUTH_TOKEN, persona, locale);
        results.push({
          persona: persona.name,
          locale: locale.code,
          reply: out.reply,
          objectiveSaved: out.objectiveSaved,
          questCreated: out.questCreated,
          messageCount: out.messageCount,
          error: null,
        });
        const status = out.objectiveSaved ? (out.questCreated ? '✅ objetivo + quest' : '✅ objetivo') : '⚠️ sem objetivo';
        console.log(`${status} ${key} (${out.messageCount} msgs)`);
        console.log(`   ${out.reply}\n`);
      } catch (e) {
        failed++;
        results.push({
          persona: persona.name,
          locale: locale.code,
          reply: null,
          objectiveSaved: false,
          questCreated: false,
          error: e.message,
        });
        console.log(`❌ ${key}`);
        console.log(`   ${e.message}\n`);
      }
    }
  }

  const outPath = process.env.SIMULATE_OUTPUT || 'simulate-coaches-results.json';
  const fs = require('fs');
  fs.writeFileSync(outPath, JSON.stringify({ results, runAt: new Date().toISOString() }, null, 2));
  console.log(`\nResults written to ${outPath}`);

  const off = analyzeOffResponses(results);
  if (off.length > 0) {
    console.log('\n--- Off responses ---');
    off.forEach((o) => {
      console.log(`  ${o.persona} / ${o.locale}: ${o.issues.join(', ')}`);
      console.log(`    snippet: ${o.replySnippet}`);
    });
  } else {
    console.log('\n--- No off responses detected ---');
  }

  const saved = results.filter((r) => r.objectiveSaved).length;
  const withQuest = results.filter((r) => r.questCreated).length;
  console.log('\n--- Summary ---');
  console.log(`Total: ${results.length} (${results.length - failed} ok, ${failed} failed), off: ${off.length}`);
  console.log(`Objetivo salvo: ${saved}/${results.length}, Quest criada: ${withQuest}/${results.length}`);
  if (failed > 0) {
    console.log('\nFailed:');
    results.filter((r) => r.error).forEach((r) => console.log(`  ${r.persona} / ${r.locale}: ${r.error}`));
  }
}

async function runAnalyzeOnly(filePath) {
  const fs = require('fs');
  const raw = fs.readFileSync(filePath, 'utf8');
  const { results } = JSON.parse(raw);
  const off = analyzeOffResponses(results);
  console.log('\n--- Off responses ---');
  if (off.length === 0) {
    console.log('  None detected.');
    return;
  }
  off.forEach((o) => {
    console.log(`  ${o.persona} / ${o.locale}: ${o.issues.join(', ')}`);
    console.log(`    snippet: ${o.replySnippet}`);
  });
  console.log(`\nTotal: ${results.length} results, ${off.length} off.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
