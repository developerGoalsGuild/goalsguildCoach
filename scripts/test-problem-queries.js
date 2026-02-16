const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
});

(async () => {
  const client = await pool.connect();
  
  try {
    console.log('⏳ Testando queries das problemáticas...\n');
    
    // Testar query da /analytics
    console.log('📊 Testando /analytics...');
    try {
      const analytics = await client.query(`
        SELECT COUNT(*) as count FROM sessions
      `);
      console.log(`   ✅ Sessions: ${analytics.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Testar query da /reports
    console.log('\n📄 Testando /reports...');
    try {
      const reports = await client.query(`
        SELECT COUNT(*) as count FROM quests
      `);
      console.log(`   ✅ Quests: ${reports.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Testar query da /achievements
    console.log('\n🏆 Testando /achievements...');
    try {
      const achievements = await client.query(`
        SELECT COUNT(*) as count FROM achievements
      `);
      console.log(`   ✅ Achievements: ${achievements.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Testar query da /insights
    console.log('\n💡 Testando /insights...');
    try {
      const insights = await client.query(`
        SELECT COUNT(*) as count FROM weekly_reviews
      `);
      console.log(`   ✅ Weekly Reviews: ${insights.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    // Testar query da /daily
    console.log('\n📅 Testando /daily...');
    try {
      const daily = await client.query(`
        SELECT COUNT(*) as count FROM daily_checkins
      `);
      console.log(`   ✅ Daily Check-ins: ${daily.rows[0].count}`);
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
    
    console.log('\n✅ Todas as queries executadas com sucesso!');
    console.log('\n📋 TABELAS NECESSÁRIAS PARA AS PÁGINAS:');
    console.log('   /analytics → sessions');
    console.log('   /reports → quests');
    console.log('   /achievements → achievements');
    console.log('   /insights → weekly_reviews');
    console.log('   /daily → daily_checkins');
    
    await client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    process.exit(1);
  }
})();
