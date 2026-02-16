// Script para testar navegação em todas as páginas com autenticação
const http = require('http');

const BASE_URL = 'localhost:3002';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDJmMmIzZS0xOTU3LTQxODMtOGYxMy0xMmJjNTlkMTgwZjYiLCJlbWFpbCI6InRlc3RlQGdvYWxzZ3VpbGQuY29tIiwiaWF0IjoxNzcwOTc0NjY3LCJleHAiOjE3NzM1NjY2Njd9.dSvyByb4aDR9GDGTMKZsFmZ7V6HmX24_-40D2VZUBgQ';

const pages = [
  { path: '/', name: 'Home' },
  { path: '/login', name: 'Login' },
  { path: '/coach', name: 'Coach' },
  { path: '/objectives', name: 'Objectives' },
  { path: '/quests', name: 'Quests' },
  { path: '/tasks', name: 'Tasks' },
  { path: '/daily', name: 'Daily Check-in' },
  { path: '/analytics', name: 'Analytics' },
  { path: '/reports', name: 'Reports' },
  { path: '/achievements', name: 'Achievements' },
  { path: '/insights', name: 'Insights' }
];

async function testPage(page) {
  return new Promise((resolve) => {
    const options = {
      hostname: BASE_URL,
      port: 3002,
      path: page.path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          name: page.name,
          path: page.path,
          status: res.statusCode,
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        name: page.name,
        path: page.path,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        name: page.name,
        path: page.path,
        status: 'TIMEOUT',
        success: false
      });
    });

    req.end();
  });
}

async function testAllPages() {
  console.log('🔍 Navegando por todas as páginas...\n');
  
  const results = await Promise.all(pages.map(testPage));

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.status}`);
    } else {
      console.log(`❌ ${result.name}: ${result.status}`);
    }
  });

  const success = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n📊 RESUMO: ${success}/${total} páginas acessíveis`);
}

testAllPages();
