import { Pool } from 'pg';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente (override do SO)
dotenv.config({ path: '.env.local', override: true });

let pool = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || process.env.PGHOST || '127.0.0.1',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
      database: process.env.DB_NAME || process.env.PGDATABASE || 'goalsguild',
      user: process.env.DB_USER || process.env.PGUSER || 'n8n',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function initDB() {
  const pool = getPool();
  
  // Sessions table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      persona_tone VARCHAR(50) DEFAULT 'sharp',
      persona_specialization VARCHAR(50) DEFAULT 'general',
      persona_archetype VARCHAR(50) DEFAULT 'mentor',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await pool.query(`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0`);

  // Messages table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Tasks table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      due_date TIMESTAMP,
      estimated_hours DECIMAL(5,2) DEFAULT 0,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      quest_id INTEGER REFERENCES quests(id) ON DELETE SET NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Goals table (upgraded to support quest breakdown)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS goals (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      parent_quest_id INTEGER REFERENCES quests(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      description TEXT,
      target_date DATE,
      progress INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Quests table (NEW)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quests (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      parent_goal_id INTEGER REFERENCES goals(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      difficulty VARCHAR(20) DEFAULT 'medium',
      quest_type VARCHAR(50) DEFAULT 'main',
      status VARCHAR(20) DEFAULT 'planning',
      xp_reward INTEGER DEFAULT 100,
      start_date TIMESTAMP,
      target_date DATE,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Quest milestones (sub-quests)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quest_milestones (
      id SERIAL PRIMARY KEY,
      quest_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      due_date TIMESTAMP,
      completed_at TIMESTAMP,
      order_index INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
    );
  `);

  // Quest completions / journal
  await pool.query(`
    CREATE TABLE IF NOT EXISTS quest_journal (
      id SERIAL PRIMARY KEY,
      quest_id INTEGER NOT NULL,
      entry_type VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      mood VARCHAR(50),
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE
    );
  `);

  // Streaks table (updated)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS streaks (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      activity_date DATE NOT NULL,
      quests_completed INTEGER DEFAULT 0,
      quests_total INTEGER DEFAULT 0,
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, activity_date),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS streak_freezes (
      session_id VARCHAR(255) NOT NULL,
      used_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (session_id, used_date),
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // User preferences for time management
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) UNIQUE NOT NULL,
      daily_work_hours DECIMAL(5,2) DEFAULT 6,
      timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // NLP Well-Formed Outcomes (objectives)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nlp_objectives (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // NLP objective details (8 criteria)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nlp_objective_details (
      id SERIAL PRIMARY KEY,
      objective_id INTEGER NOT NULL,
      statement TEXT NOT NULL,
      context_when TEXT,
      context_where TEXT,
      context_who TEXT,
      sensory_visual TEXT,
      sensory_auditory TEXT,
      sensory_kinesthetic TEXT,
      compelling_factor TEXT,
      ecology_family_impact TEXT,
      ecology_family_resolution TEXT,
      ecology_health_impact TEXT,
      ecology_health_resolution TEXT,
      ecology_finance_impact TEXT,
      ecology_finance_resolution TEXT,
      ecology_other TEXT,
      self_initiated_control TEXT,
      self_initiated_not_in_control TEXT,
      resources_internal TEXT[],
      resources_external TEXT[],
      evidence_i_will_know TEXT,
      evidence_others_will_see TEXT,
      evidence_metrics TEXT,
      timeline_start DATE,
      timeline_target DATE,
      timeline_checkpoints TEXT[],
      coaching_notes TEXT,
      FOREIGN KEY (objective_id) REFERENCES nlp_objectives(id) ON DELETE CASCADE
    );
  `);

  // Objective reminders (check-ins)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS objective_reminders (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      objective_id INTEGER NOT NULL,
      frequency VARCHAR(20) NOT NULL,
      reminder_type VARCHAR(50) DEFAULT 'check-in',
      next_check_in TIMESTAMP NOT NULL,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
      FOREIGN KEY (objective_id) REFERENCES nlp_objectives(id) ON DELETE CASCADE
    );
  `);

  // Achievements
  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(20) NOT NULL,
      requirement_value INTEGER NOT NULL,
      icon VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // User achievements (unlocked)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE(session_id, achievement_id)
    );
  `);

  // Insert default achievements
  const achievementsCount = await pool.query('SELECT COUNT(*) FROM achievements');
  if (achievementsCount.rows[0].count === 0) {
    console.log('Inserting default achievements...');
    await pool.query(`
      INSERT INTO achievements (name, description, category, requirement_value, icon) VALUES
      ('Primeira Quest', 'Complete sua primeira quest', 'quests', 1, '🎯'),
      ('Explorador', 'Complete 5 quests', 'quests', 5, '🗺️'),
      ('Aventureiro', 'Complete 10 quests', 'quests', 10, '⚔️'),
      ('Herói', 'Complete 25 quests', 'quests', 25, '🦸'),
      ('Lenda', 'Complete 50 quests', 'quests', 50, '👑'),
      ('Primeiros Passos', 'Ganhe 100 XP', 'xp', 100, '👣'),
      ('Explorador de XP', 'Ganhe 500 XP', 'xp', 500, '💰'),
      ('Caçador de XP', 'Ganhe 1000 XP', 'xp', 1000, '💎'),
      ('Mestre do XP', 'Ganhe 2500 XP', 'xp', 2500, '🏆'),
      ('Lendário', 'Ganhe 5000 XP', 'xp', 5000, '⭐'),
      ('Primeiro Dia', 'Conquiste sua primeira streak', 'streak', 1, '🔥'),
      ('Em Chamas', 'Chegue a uma streak de 3 dias', 'streak', 3, '🔥🔥'),
      ('Inquebrável', 'Chegue a uma streak de 7 dias', 'streak', 7, '💪'),
      ('Mestre da Consistência', 'Chegue a uma streak de 30 dias', 'streak', 30, '🏅'),
      ('Primeiro Objetivo', 'Crie seu primeiro objetivo NLP', 'objectives', 1, '🎯'),
      ('Focado', 'Crie 5 objetivos NLP', 'objectives', 5, '🎯🎯'),
      ('Dedicado', 'Crie 10 objetivos NLP', 'objectives', 10, '🎯🎯🎯')
    `);
    console.log('Default achievements inserted!');
  }

  // Notifications table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT NOT NULL,
      scheduled_for TIMESTAMP NOT NULL,
      sent_at TIMESTAMP,
      status VARCHAR(20) DEFAULT 'scheduled',
      data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Pomodoro sessions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      mode VARCHAR(20) NOT NULL,
      duration_minutes INTEGER NOT NULL,
      completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  // Weekly reviews
  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_reviews (
      id SERIAL PRIMARY KEY,
      session_id VARCHAR(255) NOT NULL,
      week_start TIMESTAMP NOT NULL,
      answers JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized with quests, time management, NLP objectives, reminders, achievements, notifications, pomodoro and weekly reviews support');
}

export async function getUserPreferences(pool, sessionId) {
  const result = await pool.query(
    'SELECT * FROM user_preferences WHERE session_id = $1',
    [sessionId]
  );
  return result.rows[0] || null;
}

export async function updateUserPreferences(pool, sessionId, preferences) {
  await pool.query(
    'UPDATE user_preferences SET daily_work_hours = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2',
    [preferences.daily_work_hours || 6, sessionId]
  );
}

/** Ensure streak_freezes table exists (for DBs created without it). Safe to call on every request. */
export async function ensureStreakFreezesTable(pool) {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streak_freezes (
        session_id VARCHAR(255) NOT NULL,
        used_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, used_date),
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      )
    `);
  } catch (_) {}
}
