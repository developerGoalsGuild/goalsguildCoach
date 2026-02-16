/**
 * Audita o schema do banco vs SQL no código
 * Uso: node scripts/audit-schema.js
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
});

async function getSchema() {
  const r = await pool.query(`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name IN ('goals','quests','tasks','tasks_table','messages','milestones','quest_milestones','objective_memories','streaks','user_preferences')
    ORDER BY table_name, ordinal_position
  `);
  return r.rows;
}

async function main() {
  try {
    const rows = await getSchema();
    const byTable = {};
    for (const row of rows) {
      if (!byTable[row.table_name]) byTable[row.table_name] = [];
      byTable[row.table_name].push(row.column_name);
    }

    console.log('=== SCHEMA REAL DO BANCO ===\n');
    for (const [table, cols] of Object.entries(byTable)) {
      console.log(`${table}: ${cols.join(', ')}`);
    }

    console.log('\n=== DIVERGÊNCIAS ENCONTRADAS ===\n');

    // Questões conhecidas
    const issues = [];

    if (byTable.quests) {
      const q = byTable.quests;
      if (!q.includes('quest_type')) issues.push('quests: código usa quest_type - NÃO EXISTE no banco');
      if (!q.includes('xp_reward') && !q.includes('estimated_xp')) issues.push('quests: código usa xp_reward - verificar se existe estimated_xp');
      if (!q.includes('user_id') && !q.includes('session_id')) issues.push('quests: código usa user_id ou session_id - verificar');
      if (!q.includes('start_date')) issues.push('quests: código usa start_date - pode não existir');
      if (!q.includes('target_date')) issues.push('quests: código usa target_date - pode não existir');
    }

    if (byTable.quest_milestones) {
      const qm = byTable.quest_milestones;
      if (!qm.includes('order_index')) issues.push('quest_milestones: código usa order_index - pode não existir');
    }

    if (byTable.milestones && !byTable.quest_milestones) {
      issues.push('Banco tem "milestones", código usa "quest_milestones" - TABELAS DIFERENTES');
    }

    if (byTable.tasks && !byTable.tasks_table) {
      issues.push('Banco tem "tasks", schema-working tem "tasks_table" - verificar qual existe');
    }

    if (byTable.tasks_table && !byTable.tasks) {
      issues.push('Banco tem "tasks_table", código usa "tasks" em várias rotas - TABELA ERRADA');
    }

    if (byTable.goals) {
      const g = byTable.goals;
      if (!g.includes('session_id') && !g.includes('user_id')) issues.push('goals: verificar session_id vs user_id');
      if (!g.includes('statement') || !g.includes('nlp_criteria_positive')) issues.push('goals: verificar colunas NLP (unify-goals-tables)');
    }

    if (byTable.messages) {
      const m = byTable.messages;
      if (!m.includes('session_id') && !m.includes('user_id')) issues.push('messages: verificar session_id vs user_id');
    }

    issues.forEach((i, idx) => console.log(`${idx + 1}. ${i}`));
    if (issues.length === 0) console.log('Nenhuma divergência óbvia detectada.');

    await pool.end();
  } catch (err) {
    console.error('Erro:', err.message);
    process.exit(1);
  }
}

main();
