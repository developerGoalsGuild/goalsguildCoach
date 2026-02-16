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

async function runSchema() {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Lendo schema-working.sql...\n');
    
    const sql = fs.readFileSync('./schema-working.sql', 'utf8');
    
    // Separar em blocos: tabelas, índices, dados
    const createTableRegex = /CREATE TABLE[^;]+;/gi;
    const createIndexRegex = /CREATE INDEX[^;]+;/gi;
    const insertRegex = /INSERT INTO[^;]+;/gi;
    
    const tables = sql.match(createTableRegex) || [];
    const indexes = sql.match(createIndexRegex) || [];
    const inserts = sql.match(insertRegex) || [];
    
    console.log(`📝 Encontrados: ${tables.length} tabelas, ${indexes.length} índices, ${inserts.length} inserts\n`);
    
    // Executar tabelas primeiro
    console.log('⏳ Criando tabelas...');
    for (let i = 0; i < tables.length; i++) {
      const statement = tables[i].trim();
      if (statement.length > 0) {
        await client.query(statement);
        console.log(`   ${i + 1}/${tables.length} tabelas criadas`);
      }
    }
    console.log('✅ Todas tabelas criadas!\n');
    
    // Executar índices depois
    console.log('⏳ Criando índices...');
    for (let i = 0; i < indexes.length; i++) {
      const statement = indexes[i].trim();
      if (statement.length > 0) {
        try {
          await client.query(statement);
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`   Aviso: ${error.message}`);
          }
        }
        console.log(`   ${i + 1}/${indexes.length} índices criados`);
      }
    }
    console.log('✅ Todos os índices criados!\n');
    
    // Executar inserts por último
    console.log('⏳ Populando achievements...');
    for (let i = 0; i < inserts.length; i++) {
      const statement = inserts[i].trim();
      if (statement.length > 0) {
        try {
          await client.query(statement);
        } catch (error) {
          if (!error.message.includes('duplicate key')) {
            console.log(`   Aviso: ${error.message}`);
          }
        }
        console.log(`   ${i + 1}/${inserts.length} inserts executados`);
      }
    }
    console.log('✅ Achievements populados!\n');
    
    // Verificar resultado
    const tablesList = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log(`=== ${tablesList.rows.length} TABELAS NO BANCO ===`);
    tablesList.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    const achievements = await client.query('SELECT COUNT(*) as count FROM achievements');
    console.log(`\n✅ ${achievements.rows[0].count} achievements cadastrados`);
    
    console.log('\n=== MIGRAÇÃO CONCLUÍDA COM SUCESSO! ===\n');
    console.log('✅ Tabelas criadas!');
    console.log('✅ Índices criados!');
    console.log('✅ Achievements populados!');
    console.log('\n🚀 PRONTO PARA RODAR!');
    
    await client.release();
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ ERRO NA MIGRAÇÃO:');
    console.error('   Mensagem:', error.message);
    console.error('   Código:', error.code);
    process.exit(1);
  }
}

runSchema();
