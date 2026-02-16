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

async function runSimpleSchema() {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Executando schema-simple.sql...\n');
    
    const sql = fs.readFileSync('./schema-simple.sql', 'utf8');
    
    // Separar statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Executar cada statement
    for (const statement of statements) {
      if (statement.length > 0) {
        await client.query(statement);
      }
    }
    
    console.log('✅ Schema simples executado com sucesso!\n');
    
    // Verificar tabelas criadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`=== ${tables.rows.length} TABELAS NO BANCO ===`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    console.log('\n=== MIGRAÇÃO CONCLUÍDA! ===');
    console.log('✅ Tabelas criadas!');
    console.log('✅ Índices criados!');
    console.log('✅ Achievements populados!');
    console.log('\n✅ PRONTO PARA RODAR! 🚀');
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
}

runSimpleSchema();
