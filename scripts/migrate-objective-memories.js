/**
 * Migration: Criar tabela objective_memories
 * Armazena memórias formatadas de objetivos NLP para contexto do Coach
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local'), override: true });

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || 'changeMe',
});

async function migrate() {

  console.log('🚀 Iniciando migration: objective_memories...');

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS objective_memories (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        objective_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
        session_id VARCHAR(255) NOT NULL,
        memory TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela objective_memories criada');

    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_objective_memories_objective ON objective_memories(objective_id)'
    );
    await pool.query(
      'CREATE INDEX IF NOT EXISTS idx_objective_memories_session ON objective_memories(session_id)'
    );
    console.log('✅ Índices criados');

    console.log('✅ Migration completada com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  }
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Erro fatal:', err);
    process.exit(1);
  });
