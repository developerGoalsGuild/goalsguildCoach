const { Pool } = require('pg');

// Variáveis de ambiente do SO
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'n8n',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 5000,
});

console.log('=== TESTE DE CONEXÃO COM POSTGRESQL ===\n');
console.log('Configuração:');
console.log('  Host:', process.env.DB_HOST || '127.0.0.1');
console.log('  Port:', process.env.DB_PORT || 5432);
console.log('  Database:', process.env.DB_NAME || 'n8n');
console.log('  User:', process.env.DB_USER || 'n8n');
console.log('  Password:', process.env.DB_PASSWORD ? '***SETADA***' : 'NÃO SETADA');
console.log('  OpenAI Key:', process.env.OPENAI_API_KEY ? '***SETADA***' : 'NÃO SETADA');
console.log('');

async function testConnection() {
  try {
    console.log('⏳ Tentando conectar ao PostgreSQL...');
    
    const client = await pool.connect();
    console.log('✅ CONEXÃO BEM-SUCEDIDA!\n');
    
    // Testar query
    console.log('⏳ Executando query de teste...');
    const result = await client.query('SELECT version(), NOW() as current_time');
    console.log('✅ QUERY EXECUTADA COM SUCESSO!\n');
    
    console.log('=== INFORMAÇÕES DO BANCO ===');
    console.log('Versão PostgreSQL:', result.rows[0].version);
    console.log('Hora do servidor:', result.rows[0].current_time);
    console.log('');
    
    // Verificar tabelas existentes
    console.log('⏳ Listando tabelas existentes...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tables.rows.length === 0) {
      console.log('⚠️  NENHUMA TABELA ENCONTRADA');
      console.log('💡 Você precisa rodar os migrations:\n   psql -U n8n -d n8n < schema.sql');
    } else {
      console.log(`✅ ${tables.rows.length} TABELAS ENCONTRADAS:`);
      tables.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.table_name}`);
      });
    }
    
    console.log('\n=== TESTE FINALIZADO COM SUCESSO! ===\n');
    console.log('✅ PostgreSQL está funcionando perfeitamente!');
    console.log('✅ Pronto para rodar a aplicação GoalsGuild Coach!');
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ ERRO DE CONEXÃO:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    console.error('');
    console.error('💡 SOLUÇÕES POSSÍVEIS:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   → PostgreSQL não está rodando');
      console.error('   → Verifique: sudo service postgresql start');
    } else if (error.code === '3D000') {
      console.error('   → Database não existe');
      console.error('   → Criar: createdb n8n');
    } else if (error.code === '28P01') {
      console.error('   → Senha incorreta ou usuário inexistente');
      console.error('   → Verifique DB_USER e DB_PASSWORD');
    }
    
    console.error('');
    process.exit(1);
  }
}

testConnection();
