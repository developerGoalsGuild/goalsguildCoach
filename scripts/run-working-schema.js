const { Pool } = require('pg');
const fs = require('fs');
const { execSync } = require('child_process');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
});

async function runWorkingSchema() {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Executando schema-working.sql via psql...\n');
    
    // Usar psql via shell para evitar problemas de separação
    const psqlCommand = `PGPASSWORD=${process.env.DB_PASSWORD || ''} psql -h ${process.env.DB_HOST || '127.0.0.1'} -p ${process.env.DB_PORT || 5432} -U ${process.env.DB_USER || 'n8n'} -d goalsguild -f schema-working.sql`;
    
    try {
      execSync(psqlCommand, { stdio: 'inherit' });
      console.log('✅ Schema executado com sucesso!\n');
    } catch (error) {
      console.error('❌ Erro ao executar psql:', error.message);
      throw error;
    }
    
    // Verificar tabelas criadas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`=== ${tables.rows.length} TABELAS NO BANCO GOALSGUILD ===`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    // Verificar achievements
    const achievements = await client.query('SELECT COUNT(*) as count FROM achievements');
    console.log(`\n✅ ${achievements.rows[0].count} achievements cadastrados`);
    
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
    process.exit(1);
  }
}

runWorkingSchema();
