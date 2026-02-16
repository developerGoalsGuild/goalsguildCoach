// Script simplificado para testar todas as páginas
const http = require('http');

const pages = [
  '/',
  '/login',
  '/coach',
  '/objectives',
  '/quests',
  '/tasks',
  '/daily',
  '/analytics',
  '/reports',
  '/achievements',
  '/insights'
];

let completed = 0;

pages.forEach((path, index) => {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: path,
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    const status = res.statusCode === 200 ? '✅' : '❌';
    console.log(`${status} ${path}: ${res.statusCode}`);
    
    completed++;
    if (completed === pages.length) {
      console.log('\n✅ Todas as páginas testadas!');
    }
  });

  req.on('error', (error) => {
    console.log(`❌ ${path}: ${error.message}`);
    completed++;
  });

  req.setTimeout(5000);
  req.end();
});
