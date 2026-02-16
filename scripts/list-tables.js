const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
});

(async () => {
  const client = await pool.connect();
  
  try {
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('TABELAS NO BANCO:\n');
    tables.rows.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.table_name}`);
    });
    
    await client.release();
    await pool.end();
  } catch (error) {
    console.error('Erro:', error.message);
    process.exit(1);
  }
})();
