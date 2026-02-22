#!/usr/bin/env node
/**
 * Simulates a profile update (PATCH /api/user/profile).
 *
 * Usage:
 *   TEST_TOKEN=eyJ... node scripts/simulate-profile-update.js
 *   TEST_EMAIL=user@test.com TEST_PASSWORD=Senha123 node scripts/simulate-profile-update.js
 */

try {
  require('dotenv').config({ path: '.env.local' });
  require('dotenv').config();
} catch (_) {}

const BASE_URL = process.env.BASE_URL || 'http://localhost:3002';
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

async function getProfile(token) {
  const res = await fetch(`${BASE_URL}/api/user/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`GET profile failed: ${res.status}`);
  return res.json();
}

async function updateProfile(token, payload) {
  const res = await fetch(`${BASE_URL}/api/user/profile`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `PATCH failed: ${res.status}`);
  }
  return res.json();
}

async function main() {
  if (!AUTH_TOKEN) {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;
    if (email && password) {
      console.log('Logging in...');
      AUTH_TOKEN = await login(email, password);
    } else {
      console.error('Set TEST_TOKEN or TEST_EMAIL and TEST_PASSWORD.');
      process.exit(1);
    }
  }

  console.log('\n=== Simulate profile update ===\n');

  const before = await getProfile(AUTH_TOKEN);
  console.log('Before:', JSON.stringify({ name: before.name, daily_work_hours: before.daily_work_hours, focus_area: before.focus_area }, null, 2));

  const payload = {
    name: before.name ? `${before.name} (updated)` : 'User Updated',
    daily_work_hours: 8,
    focus_area: 'productivity',
    context_for_coach: 'Simulated profile update test.',
  };

  console.log('\nPATCH payload:', JSON.stringify(payload, null, 2));

  const after = await updateProfile(AUTH_TOKEN, payload);
  console.log('\nAfter:', JSON.stringify({ name: after.name, daily_work_hours: after.daily_work_hours, focus_area: after.focus_area, context_for_coach: after.context_for_coach }, null, 2));

  console.log('\n✅ Profile update simulated successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
