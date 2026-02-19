const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });
const crypto = require('crypto');

// Same as app/lib/crypto.js (PBKDF2_ITERATIONS default 120000)
const PBKDF2_ITERATIONS = Number.parseInt(process.env.PBKDF2_ITERATIONS || '120000', 10);
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'goalsguild',
    user: process.env.DB_USER || 'n8n',
    password: process.env.DB_PASSWORD || '',
  });

  const email = 'luana@goalsguild.com';
  const password = 'teste123';
  const name = 'Luana';

  const client = await pool.connect();
  try {
    const passwordHash = await hashPassword(password);
    await client.query('DELETE FROM users WHERE email = $1', [email]);
    const result = await client.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    const user = result.rows[0];
    console.log('✅ Usuário criado com sucesso.');
    console.log('   Email:', user.email);
    console.log('   Nome:', user.name);
    console.log('   ID:', user.id);
    console.log('   Senha: teste123');
  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
