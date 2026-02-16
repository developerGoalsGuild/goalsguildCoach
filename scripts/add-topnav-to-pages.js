#!/usr/bin/env node

// Script para adicionar TopNavigation a todas as páginas principais

const fs = require('fs');
const path = require('path');

const pages = [
  'coach/page.js',
  'quests/page.js',
  'tasks/page.js',
  'daily/page.js',
  'objectives/page.js',
  'reports/page.js'
];

pages.forEach(page => {
  const filePath = path.join(__dirname, '..', 'app', page);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${page}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar se já tem TopNavigation
  if (content.includes('TopNavigation')) {
    console.log(`✓ ${page} already has TopNavigation`);
    return;
  }

  // Adicionar import
  content = content.replace(
    /'use client';/,
    `'use client';\nimport TopNavigation from '../../components/TopNavigation';`
  );

  // Adicionar ao return
  content = content.replace(
    /return \(\s*<div style=\{\{ display: 'flex', height: '100vh',/,
    'return (\n    <>\n      <TopNavigation />\n      <div style={{ display: \'flex\', height: \'100vh\', paddingTop: \'60px\''
  );

  // Fechar fragmento
  content = content.replace(
    /<\/div>\s*\);\s*\}/,
    '</div>\n    </>\n  );\n}'
  );

  fs.writeFileSync(filePath, content);
  console.log(`✓ Updated ${page}`);
});

console.log('\\n✅ All pages updated with TopNavigation!');
