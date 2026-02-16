const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });
const crypto = require('crypto');

// Funções compatíveis com app/lib/crypto.js
function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 1000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function createTestUser() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'goalsguild',
    user: process.env.DB_USER || 'n8n',
    password: process.env.DB_PASSWORD || '',
  });

  const client = await pool.connect();
  
  try {
    console.log('⏳ Recriando usuário de teste com hash correto...\n');
    
    // Dados do usuário de teste
    const email = 'teste@goalsguild.com';
    const password = 'teste123';
    const name = 'Usuário Teste';
    
    // Hash da senha (usando mesmas funções do app)
    const passwordHash = await hashPassword(password);
    
    // Deletar usuário existente se houver
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    
    // Inserir usuário
    const result = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    
    const user = result.rows[0];
    
    console.log('✅ USUÁRIO CRIADO COM SUCESSO!\n');
    console.log('📋 CREDENCIAIS DE TESTE:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   📧 Email:    ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   👤 Name:     ${name}`);
    console.log(`   🆔 ID:       ${user.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🌐 Para testar:');
    console.log('   1. Acesse: http://localhost:3002/login');
    console.log('   2. Use as credenciais acima\n');
    
    console.log('📝 Ou via API:');
    console.log('   curl -X POST http://localhost:3002/api/auth/login \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log(`     -d '{"email":"${email}","password":"${password}"}'\n`);
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

createTestUser();
