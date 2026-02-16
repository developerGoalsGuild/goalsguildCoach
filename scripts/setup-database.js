const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Conectar ao postgres padrão
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('=== CONFIGURANDO BANCO DE DADOS PARA GOALSGUILD COACH ===\n');
    
    // Criar banco goalsguild
    console.log('⏳ Criando banco goalsguild...');
    await client.query('CREATE DATABASE goalsguild');
    console.log('✅ Banco goalsguild criado!\n');
    
    // Conectar ao novo banco
    const pool2 = new Pool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      database: 'goalsguild',
      user: process.env.DB_USER || 'n8n',
      password: process.env.DB_PASSWORD || '',
    });
    
    const client2 = await pool2.connect();
    
    // Verificar se a tabela users existe
    console.log('⏳ Verificando tabelas no banco goalsguild...');
    const tables = await client2.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  NENHUMA TABELA ENCONTRADA');
      console.log('💡 Você precisa rodar as migrations:\n');
      console.log('   psql -U n8n -d goalsguild < schema.sql');
      console.log('   psql -U n8n -d goalsguild < schema-achievements.sql');
      console.log('   psql -U n8n -d goalsguild < schema-with-auth.sql');
    } else {
      console.log(`✅ ${tables.rows.length} tabelas encontradas no banco goalsguild`);
    }
    
    console.log('\n=== CONFIGURAÇÃO CONCLUÍDA ===\n');
    console.log('✅ Banco de dados pronto para uso!');
    console.log('✅ Variáveis de ambiente necessárias:');
    console.log('');
    console.log('DB_HOST=127.0.0.1');
    console.log('DB_PORT=5432');
    console.log('DB_NAME=goalsguild');
    console.log('DB_USER=n8n');
    console.log('DB_PASSWORD=' + (process.env.DB_PASSWORD || ''));
    console.log('');
    
    await client2.release();
    await pool2.end();
    
  } catch (error) {
    if (error.code === '42P04') {
      console.log('✅ Banco goalsguild JÁ EXISTE!\n');
      console.log('=== CONFIGURAÇÃO JÁ CONCLUÍDA ===\n');
      console.log('✅ Banco de dados pronto para uso!');
      console.log('✅ Variáveis de ambiente necessárias:');
      console.log('');
      console.log('DB_HOST=127.0.0.1');
      console.log('DB_PORT=5432');
      console.log('DB_NAME=goalsguild');
      console.log('DB_USER=n8n');
      console.log('DB_PASSWORD=' + (process.env.DB_PASSWORD || ''));
      console.log('');
    } else {
      console.error('❌ Erro:', error.message);
      process.exit(1);
    }
  } finally {
    await client.release();
    await pool.end();
  }
}

setupDatabase();
