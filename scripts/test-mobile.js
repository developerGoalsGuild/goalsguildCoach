#!/usr/bin/env node

/**
 * Teste Mobile - GoalsGuild Coach
 * Verifica responsividade e componentes mobile
 */

const http = require('http');

const BASE_URL = 'http://localhost:3002';

function request(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    http.get(url.href, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
  });
}

async function testMobileComponents() {
  console.log('\n📱 TESTE MOBILE - GOALSGUILD COACH');
  console.log('═══════════════════════════════════════════\n');

  // Testar páginas principais
  const pages = [
    { path: '/', name: 'Home' },
    { path: '/coach', name: 'Coach' },
    { path: '/objectives', name: 'Objectives' },
    { path: '/quests', name: 'Quests' },
    { path: '/tasks', name: 'Tasks' },
  ];

  console.log('📄 Testando páginas:\n');

  for (const page of pages) {
    try {
      const response = await request(page.path);

      if (response.status === 200) {
        const hasMobileNav = response.body.includes('MobileBottomNav');
        const hasPomodoro = response.body.includes('PomodoroTimer');
        const hasTopNav = response.body.includes('TopNavigation');

        console.log(`✅ ${page.name}:`);
        console.log(`   TopNavigation: ${hasTopNav ? '✅' : '❌'}`);
        console.log(`   MobileBottomNav: ${hasMobileNav ? '✅' : '❌'}`);
        console.log(`   PomodoroTimer: ${hasPomodoro ? '✅' : '❌'}`);
        console.log('');
      } else {
        console.log(`❌ ${page.name}: Status ${response.status}\n`);
      }
    } catch (error) {
      console.log(`❌ ${page.name}: ${error.message}\n`);
    }
  }

  console.log('═══════════════════════════════════════════');
  console.log('✅ TESTE MOBILE CONCLUÍDO!\n');
}

testMobileComponents();
