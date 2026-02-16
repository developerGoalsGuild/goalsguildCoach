const { Pool } = require('pg');

// Testar conexão com o banco de dados goalsguild
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
});

async function testDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('=== TESTE FINAL DO BANCO DE DADOS ===\n');
    
    // Testar queries
    console.log('⏳ Testando queries...');
    
    const achievements = await client.query('SELECT * FROM achievements LIMIT 5');
    console.log(`✅ Achievements: ${achievements.rows.length} encontrados`);
    
    const tables = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`✅ Tabelas: ${tables.rows[0].count} encontradas`);
    
    // Testar inserção
    console.log('\n⏳ Testando inserção de dados...');
    await client.query(`
      INSERT INTO sessions (session_id) 
      VALUES ('test-session-' || gen_random_uuid())
      ON CONFLICT (session_id) DO NOTHING
    `);
    console.log('✅ Inserção de teste funcionou!');
    
    console.log('\n=== TODOS OS TESTES PASSARAM! ===\n');
    console.log('✅ Banco de dados configurado!');
    console.log('✅ Conexão estável!');
    console.log('✅ Queries funcionando!');
    console.log('\n🚀 PRONTO PARA INICIAR O SERVIDOR!\n');
    console.log('Comandos:');
    console.log('  npm run dev    - Servidor de desenvolvimento');
    console.log('  npm run build  - Build para produção');
    console.log('  npm start      - Servidor de produção');
    console.log('  npm test       - Executar testes');
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    process.exit(1);
  }
}

testDatabase();
