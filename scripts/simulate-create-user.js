#!/usr/bin/env node
/**
 * Simula a criação de um novo usuário via API (POST /api/auth/register).
 * Inclui escolha de plano (planId). Útil para testes e para obter um token.
 *
 * Uso:
 *   node scripts/simulate-create-user.js
 *   REGISTER_EMAIL=novo@test.com REGISTER_PASSWORD=Senha123 REGISTER_NAME="Fulano" node scripts/simulate-create-user.js
 *   REGISTER_PLAN=starter node scripts/simulate-create-user.js   # free | starter | premium
 *
 * Requisitos da senha: mínimo 8 caracteres, maiúscula, minúscula e número.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';

const DEFAULT_EMAIL = `teste+${Date.now()}@goalsguild.com`;
const DEFAULT_PASSWORD = 'Senha123';
const DEFAULT_NAME = 'Usuário Simulado';

async function fetchPlanId() {
  const planName = (process.env.REGISTER_PLAN || 'free').toLowerCase();
  const res = await fetch(`${BASE_URL}/api/subscription/plans`);
  const data = await res.json().catch(() => ({}));
  if (!data.plans || data.plans.length === 0) return null;
  const plan = data.plans.find((p) => p.name.toLowerCase() === planName) || data.plans[0];
  return plan.id;
}

async function createUser() {
  const email = process.env.REGISTER_EMAIL || DEFAULT_EMAIL;
  const password = process.env.REGISTER_PASSWORD || DEFAULT_PASSWORD;
  const name = process.env.REGISTER_NAME || DEFAULT_NAME;

  console.log('📝 Simulação: criar novo usuário via API\n');
  console.log('─────────────────────────────────────────');
  console.log(`   URL: ${BASE_URL}/api/auth/register`);
  console.log(`   Email: ${email}`);
  console.log(`   Name: ${name}`);
  console.log(`   Plan: ${process.env.REGISTER_PLAN || 'free'}`);
  console.log('─────────────────────────────────────────\n');

  try {
    const planId = await fetchPlanId();

    const payload = { email, password, name };
    if (planId) payload.planId = planId;

    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.user && data.token) {
      console.log('✅ Usuário criado com sucesso!\n');
      console.log('📋 Dados retornados:');
      console.log(`   ID:    ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Name:  ${data.user.name}`);
      console.log(`   Plan:  ${planId ? process.env.REGISTER_PLAN || 'free' : 'free (default)'}`);
      console.log(`   Token: ${data.token.substring(0, 50)}...\n`);
      console.log('🔑 Para usar em outros scripts (login já feito):');
      console.log(`   export TEST_EMAIL="${data.user.email}"`);
      console.log(`   export TEST_PASSWORD="${password}"`);
      console.log(`   export TEST_TOKEN="${data.token}"\n`);
      console.log('🌐 Login no app:');
      console.log(`   ${BASE_URL}/login`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Senha: ${password}\n`);
      return { user: data.user, token: data.token, password };
    }

    if (response.status === 409) {
      console.log('⚠️ Usuário já existe com este email.');
      console.log('   Use outro REGISTER_EMAIL ou faça login com as credenciais atuais.\n');
      process.exit(1);
    }

    if (response.status === 400) {
      console.log('❌ Dados inválidos:', data.error || 'Email e senha obrigatórios.');
      console.log('   Senha deve ter 8+ caracteres, maiúscula, minúscula e número.\n');
      process.exit(1);
    }

    if (response.status === 429) {
      console.log('❌ Muitas tentativas. Aguarde alguns minutos (rate limit).\n');
      process.exit(1);
    }

    console.log('❌ Falha ao criar usuário.');
    console.log(`   Status: ${response.status}`);
    console.log('   Resposta:', data);
    process.exit(1);
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    console.log('\n   Verifique se o servidor está rodando (npm run dev) e BASE_URL está correto.\n');
    process.exit(1);
  }
}

createUser();
