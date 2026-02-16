/**
 * Unificar tabelas goals e nlp_objectives
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5432,
  database: 'goalsguild',
  user: 'n8n',
  password: 'changeMe'
});

(async () => {
  const client = await pool.connect();
  try {
    console.log('🔄 Iniciando unificação das tabelas goals e nlp_objectives...\n');

    // 1. Adicionar colunas NLP à tabela goals
    console.log('1️⃣ Adicionando colunas NLP à tabela goals...');
    
    const columns = [
      'statement TEXT',
      'category VARCHAR(50)',
      'nlp_criteria_positive TEXT',
      'nlp_criteria_sensory TEXT',
      'nlp_criteria_compelling TEXT',
      'nlp_criteria_ecology TEXT',
      'nlp_criteria_self_initiated TEXT',
      'nlp_criteria_context TEXT',
      'nlp_criteria_resources TEXT',
      'nlp_criteria_evidence TEXT',
      'is_nlp_complete BOOLEAN DEFAULT FALSE'
    ];

    for (const column of columns) {
      try {
        await client.query(`ALTER TABLE goals ADD COLUMN IF NOT EXISTS ${column}`);
        console.log(`   ✅ Adicionada: ${column.split(' ')[0]}`);
      } catch (error) {
        console.log(`   ⚠️  Já existe ou erro: ${column.split(' ')[0]}`);
      }
    }

    // 2. Verificar se há dados em nlp_objectives
    console.log('\n2️⃣ Verificando dados em nlp_objectives...');
    const countResult = await client.query('SELECT COUNT(*) as count FROM nlp_objectives');
    const count = parseInt(countResult.rows[0].count);
    console.log(`   📊 Encontrados: ${count} objetivos em nlp_objectives`);

    if (count > 0) {
      console.log('\n3️⃣ Migrando dados de nlp_objectives para goals...');
      
      const migrateResult = await client.query(`
        INSERT INTO goals (
          session_id,
          title,
          description,
          statement,
          category,
          nlp_criteria_positive,
          nlp_criteria_sensory,
          nlp_criteria_compelling,
          nlp_criteria_ecology,
          nlp_criteria_self_initiated,
          nlp_criteria_context,
          nlp_criteria_resources,
          nlp_criteria_evidence,
          is_nlp_complete,
          target_date,
          status,
          created_at
        )
        SELECT 
          no.session_id::text,
          COALESCE(no.statement, 'Sem título') as title,
          COALESCE(no.statement, '') as description,
          no.statement,
          no.category,
          nod.criteria_1,
          nod.criteria_2,
          nod.criteria_3,
          nod.ecology,
          nod.alignment,
          nod.resources,
          nod.evidence,
          TRUE,
          CURRENT_DATE as target_date,
          'active',
          no.created_at
        FROM nlp_objectives no
        LEFT JOIN nlp_objective_details nod ON no.id::text = nod.objective_id
        ON CONFLICT DO NOTHING
        RETURNING id
      `);
      
      console.log(`   ✅ Migrados ${migrateResult.rowCount} objetivos`);
    }

    console.log('\n✅ Unificação completa!');
    console.log('\n📊 Estrutura da tabela goals agora:');
    const descResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'goals' 
      ORDER BY ordinal_position
    `);
    
    descResult.rows.forEach(row => {
      const isNLP = row.column_name.startsWith('nlp_') || 
                   ['statement', 'category', 'is_nlp_complete'].includes(row.column_name);
      const prefix = isNLP ? '🔵 NLP: ' : '⚪ ';
      console.log(`   ${prefix}${row.column_name} (${row.data_type})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
})();
