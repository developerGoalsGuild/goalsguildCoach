/**
 * Migration: Criar tabelas de rastreamento de custos
 */

const { getPool } = require('../app/lib/db');

async function migrate() {
  const pool = getPool();
  
  console.log('🚀 Iniciando migration: Cost Tracking...');
  
  try {
    // Tabela usage_tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id BIGSERIAL PRIMARY KEY,
        session_id UUID NOT NULL,
        user_id UUID,
        model TEXT NOT NULL,
        provider TEXT NOT NULL DEFAULT 'openai',
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
        output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
        total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
        endpoint TEXT NOT NULL,
        response_time_ms INTEGER,
        status_code INTEGER,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela usage_tracking criada');

    // Índices usage_tracking
    await pool.query('CREATE INDEX IF NOT EXISTS idx_usage_session_id ON usage_tracking(session_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_tracking(user_id)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage_tracking(created_at DESC)');
    console.log('✅ Índices usage_tracking criados');

    // Tabela user_budgets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_budgets (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL UNIQUE,
        monthly_budget DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
        alert_threshold_percentage INTEGER NOT NULL DEFAULT 80,
        alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
        last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('✅ Tabela user_budgets criada');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_budget_user_id ON user_budgets(user_id)');
    console.log('✅ Índices user_budgets criados');

    // Tabela daily_cost_summaries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_cost_summaries (
        id BIGSERIAL PRIMARY KEY,
        user_id UUID NOT NULL,
        session_id UUID NOT NULL,
        summary_date DATE NOT NULL,
        total_requests INTEGER NOT NULL DEFAULT 0,
        total_input_tokens INTEGER NOT NULL DEFAULT 0,
        total_output_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
        models_used TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_user_date UNIQUE (user_id, summary_date)
      )
    `);
    console.log('✅ Tabela daily_cost_summaries criada');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_summary_user_date ON daily_cost_summaries(user_id, summary_date DESC)');
    console.log('✅ Índices daily_cost_summaries criados');

    console.log('✅ Migration completada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migration:', error);
    process.exit(1);
  }
}

// Executar migration
migrate()
  .then(() => {
    console.log('🎉 Migration finalizada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
