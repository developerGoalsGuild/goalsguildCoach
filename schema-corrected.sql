-- GoalsGuild Database Schema - CORRECTED ORDER
-- PostgreSQL 16+

-- ============================================
-- TABELAS PRINCIPAIS (SEM DEPENDÊNCIAS)
-- ============================================

-- 1. Sessions (anonymous sessions via httpOnly cookie)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABELAS COM DEPENDÊNCIAS
-- ============================================

-- 2. Messages (chat history with Coach AI) - DEPENDE DE sessions
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) REFERENCES sessions(session_id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Goals (long-term goals) - SEM DEPENDÊNCIAS
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  parent_quest_id UUID,  -- Será preenchido depois
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Quests (main objectives) - DEPENDE DE goals
CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  quest_type VARCHAR(20) DEFAULT 'main' CHECK (quest_type IN ('main', 'daily', 'challenge')),
  xp_reward INTEGER DEFAULT 100,
  start_date TIMESTAMP,
  target_date DATE,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quest Milestones (stages within quests) - DEPENDE DE quests
CREATE TABLE IF NOT EXISTS quest_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Quest Journal (history of quest events) - DEPENDE DE quests
CREATE TABLE IF NOT EXISTS quest_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID REFERENCES quests(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL,
  content TEXT,
  mood VARCHAR(50),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tasks (micro-tasks linked to active quest) - DEPENDE DE quests
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  quest_id UUID REFERENCES quests(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  estimated_hours DECIMAL(5,2),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. User Preferences (persona, language, etc) - SEM DEPENDÊNCIAS
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  persona_tone VARCHAR(20) DEFAULT 'neutral',
  persona_specialization VARCHAR(20) DEFAULT 'general',
  persona_archetype VARCHAR(20) DEFAULT 'mentor',
  language VARCHAR(10) DEFAULT 'pt',
  daily_work_hours DECIMAL(3,1) DEFAULT 6.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Streaks (consecutive active days) - SEM DEPENDÊNCIAS
CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_quest ON tasks(quest_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE INDEX IF NOT EXISTS idx_quests_session ON quests(session_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_quests_parent_goal ON quests(parent_goal_id);

CREATE INDEX IF NOT EXISTS idx_milestones_quest ON quest_milestones(quest_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON quest_milestones(status);

CREATE INDEX IF NOT EXISTS idx_journal_quest ON quest_journal(quest_id);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_goals_session ON goals(session_id);
CREATE INDEX IF NOT EXISTS idx_goals_parent_quest ON goals(parent_quest_id);

CREATE INDEX IF NOT EXISTS idx_streaks_session ON streaks(session_id);

CREATE INDEX IF NOT EXISTS idx_user_preferences_session ON user_preferences(session_id);

-- ============================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
