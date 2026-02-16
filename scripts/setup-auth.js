const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
});

async function setupAuth() {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Configurando autenticação...\n');
    
    // Criar tabela users
    console.log('📝 Criando tabela users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela users criada!\n');
    
    // Criar índice
    console.log('📊 Criando índices...');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    console.log('✅ Índices criados!\n');
    
    // Criar trigger para updated_at
    console.log('🔧 Criando trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_users_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ LANGUAGE 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_users_updated_at_trigger ON users;
      CREATE TRIGGER update_users_updated_at_trigger
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_users_updated_at();
    `);
    console.log('✅ Trigger criado!\n');
    
    // Verificar tabela users
    const check = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`✅ Tabela users verificada: ${check.rows[0].count} usuários\n`);
    
    console.log('=== AUTENTICAÇÃO CONFIGURADA! ===\n');
    console.log('✅ Tabela users criada');
    console.log('✅ Índices criados');
    console.log('✅ Triggers criados');
    console.log('\n🚀 Pronto para criar usuários!\n');
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

setupAuth();
