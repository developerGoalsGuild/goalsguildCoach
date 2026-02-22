#!/usr/bin/env node
/**
 * Run subscription migration SQL files
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
  max: 1,
});

async function runSQLFile(filepath) {
  const client = await pool.connect();
  
  try {
    console.log(`⏳ Executando ${path.basename(filepath)}...`);
    
    const sql = fs.readFileSync(filepath, 'utf8');
    
    // Execute the entire SQL file (handles BEGIN/COMMIT blocks)
    await client.query(sql);
    
    console.log(`✅ ${path.basename(filepath)} executado com sucesso!\n`);
  } catch (error) {
    console.error(`❌ Erro em ${path.basename(filepath)}:`, error.message);
    throw error;
  } finally {
    await client.release();
  }
}

async function main() {
  console.log('=== EXECUTANDO MIGRAÇÕES DE ASSINATURA ===\n');
  
  try {
    const migrationsDir = path.join(__dirname);
    
    // Run migrations in order
    const migrations = [
      'migrate-subscriptions.sql',
      'migrate-plan-limits-ai-manual.sql',
    ];
    
    for (const migration of migrations) {
      const filepath = path.join(migrationsDir, migration);
      if (fs.existsSync(filepath)) {
        await runSQLFile(filepath);
      } else {
        console.log(`⚠️  ${migration} não encontrado`);
      }
    }
    
    // Verify plans were created
    const client = await pool.connect();
    const plans = await client.query('SELECT name, display_name, price_monthly, currency FROM subscription_plans ORDER BY price_monthly');
    
    console.log('=== PLANOS CRIADOS ===');
    if (plans.rows.length > 0) {
      plans.rows.forEach((plan) => {
        console.log(`   ${plan.name}: ${plan.display_name} - $${plan.price_monthly}/${plan.currency}`);
      });
    } else {
      console.log('   ⚠️  Nenhum plano encontrado');
    }
    
    await client.release();
    await pool.end();
    
    console.log('\n=== MIGRAÇÕES CONCLUÍDAS! ===\n');
  } catch (error) {
    console.error('\n❌ ERRO NAS MIGRAÇÕES:', error.message);
    process.exit(1);
  }
}

main();
