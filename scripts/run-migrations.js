const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
});

async function runMigration(filename, sql) {
  const client = await pool.connect();
  
  try {
    console.log(`⏳ Executando ${filename}...`);
    
    // Separar statements por ponto e vírgula
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      await client.query(statement);
    }
    
    console.log(`✅ ${filename} executado com sucesso!\n`);
  } catch (error) {
    console.error(`❌ Erro em ${filename}:`, error.message);
    throw error;
  } finally {
    await client.release();
  }
}

async function main() {
  console.log('=== EXECUTANDO MIGRATIONS DO BANCO DE DADOS ===\n');
  
  try {
    // schema.sql
    if (fs.existsSync('./schema.sql')) {
      const schemaSql = fs.readFileSync('./schema.sql', 'utf8');
      await runMigration('schema.sql', schemaSql);
    } else {
      console.log('⚠️  schema.sql não encontrado');
    }
    
    // schema-achievements.sql
    if (fs.existsSync('./schema-achievements.sql')) {
      const achievementsSql = fs.readFileSync('./schema-achievements.sql', 'utf8');
      await runMigration('schema-achievements.sql', achievementsSql);
    } else {
      console.log('⚠️  schema-achievements.sql não encontrado');
    }
    
    // schema-with-auth.sql
    if (fs.existsSync('./schema-with-auth.sql')) {
      const authSql = fs.readFileSync('./schema-with-auth.sql', 'utf8');
      await runMigration('schema-with-auth.sql', authSql);
    } else {
      console.log('⚠️  schema-with-auth.sql não encontrado');
    }
    
    // Verificar tabelas criadas
    const client = await pool.connect();
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('=== TABELAS CRIADAS ===');
    console.log(`✅ ${tables.rows.length} tabelas no banco goalsguild:\n`);
    tables.rows.forEach((row, i) => {
      console.log(`   ${i + 1}. ${row.table_name}`);
    });
    
    console.log('\n=== MIGRAÇÕES CONCLUÍDAS COM SUCESSO! ===\n');
    console.log('✅ Banco de dados configurado!');
    console.log('✅ Tabelas criadas!');
    console.log('✅ Pronto para rodar a aplicação!\n');
    
    await client.release();
  } catch (error) {
    console.error('\n❌ ERRO NAS MIGRAÇÕES:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
