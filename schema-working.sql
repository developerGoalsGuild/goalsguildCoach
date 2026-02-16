-- GoalsGuild Database Schema - WORKING VERSION
-- PostgreSQL 16+

-- ============================================
-- PARTE 1: CRIAR TODAS AS TABELAS PRIMEIRO
-- ============================================

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  parent_quest_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  target_date DATE,
  progress DECIMAL(5,2) DEFAULT 0.00 CHECK (progress >= 0 AND progress <= 100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  parent_goal_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard', 'epic')),
  status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  current_xp INTEGER DEFAULT 0,
  estimated_xp INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quest_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id VARCHAR(255) NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  content TEXT,
  mood VARCHAR(50),
  xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  quest_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  estimated_hours DECIMAL(5,2),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  persona_tone VARCHAR(20) DEFAULT 'neutral',
  language VARCHAR(10) DEFAULT 'pt',
  daily_work_hours DECIMAL(3,1) DEFAULT 6.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nlp_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL,
  category VARCHAR(50),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nlp_objective_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id VARCHAR(255) NOT NULL,
  criteria_1 TEXT,
  criteria_2 TEXT,
  criteria_3 TEXT,
  criteria_4 TEXT,
  evidence TEXT,
  alignment TEXT,
  resources TEXT,
  ecology TEXT
);

CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(50) NOT NULL,
  requirement_value INTEGER NOT NULL,
  icon VARCHAR(50),
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('focus', 'short_break', 'long_break')),
  duration INTEGER NOT NULL,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS weekly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  answers JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  mood VARCHAR(20) CHECK (mood IN ('good', 'okay', 'bad')),
  gratitude TEXT,
  highlights TEXT,
  challenges TEXT,
  tomorrow_goals TEXT
);

CREATE TABLE IF NOT EXISTS objective_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL,
  objective_id VARCHAR(255) NOT NULL,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly')),
  time TIME,
  active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- PARTE 2: CRIAR TODOS OS ÍNDICES DEPOIS
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_goals_session ON goals(session_id);
CREATE INDEX IF NOT EXISTS idx_quests_session ON quests(session_id);
CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);
CREATE INDEX IF NOT EXISTS idx_milestones_quest ON milestones(quest_id);
CREATE INDEX IF NOT EXISTS idx_journal_quest ON quest_journal(quest_id);
CREATE INDEX IF NOT EXISTS idx_tasks_session ON tasks_table(session_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks_table(status);
CREATE INDEX IF NOT EXISTS idx_tasks_quest ON tasks_table(quest_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_streaks_session ON streaks(session_id);
CREATE INDEX IF NOT EXISTS idx_preferences_session ON user_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_nlp_objectives_session ON nlp_objectives(session_id);
CREATE INDEX IF NOT EXISTS idx_nlp_objective_details_id ON nlp_objective_details(objective_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_session ON user_achievements(session_id);
CREATE INDEX IF NOT EXISTS idx_notifications_session ON notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_session ON pomodoro_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reviews_session ON weekly_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_session ON daily_checkins(session_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(date);
CREATE INDEX IF NOT EXISTS idx_objective_reminders_session ON objective_reminders(session_id);

-- ============================================
-- PARTE 3: POPULAR TABELA DE ACHIEVEMENTS
-- ============================================

INSERT INTO achievements (name, category, requirement_value, icon, description) VALUES
('Primeira Quest', 'quests', 1, '🎯', 'Complete sua primeira quest'),
('Explorador', 'quests', 5, '🗺️', 'Complete 5 quests'),
('Veterano', 'quests', 10, '⭐', 'Complete 10 quests'),
('Mestre das Quests', 'quests', 50, '👑', 'Complete 50 quests'),
('Lenda Viva', 'quests', 100, '🏆', 'Complete 100 quests'),
('XP Iniciante', 'xp', 500, '💰', 'Ganhe 500 XP'),
('XP Campeão', 'xp', 5000, '🏅', 'Ganhe 5,000 XP'),
('XP Lenda', 'xp', 50000, '👑', 'Ganhe 50,000 XP'),
('Nível 5', 'xp', 1000, '⭐', 'Alcance nível 5'),
('Nível 10', 'xp', 10000, '👑', 'Alcance nível 10'),
('3 Dias Consecutivos', 'streak', 3, '🔥', '3 dias consecutivos de atividade'),
('7 Dias Consecutivos', 'streak', 7, '🔥', '7 dias consecutivos de atividade'),
('30 Dias Consecutivos', 'streak', 30, '💪', '30 dias consecutivos de atividade'),
('100 Dias Consecutivos', 'streak', 100, '👑', '100 dias consecutivos de atividade'),
('Primeiro Objetivo', 'objectives', 1, '🎯', 'Crie seu primeiro objetivo'),
('Mestre de Objetivos', 'objectives', 10, '👑', 'Complete 10 objetivos'),
('Visionário', 'objectives', 50, '🏆', 'Complete 50 objetivos')
ON CONFLICT (name) DO NOTHING;
