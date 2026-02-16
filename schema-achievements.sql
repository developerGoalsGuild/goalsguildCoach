-- Script para inicializar tabelas de achievements
-- Execute: psql -U postgres -d goalsguild -f init-achievements.sql

-- Criar tabela de achievements
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(20) NOT NULL,
  requirement_value INTEGER NOT NULL,
  icon VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de user_achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  achievement_id INTEGER NOT NULL,
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
  FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
  UNIQUE(session_id, achievement_id)
);

-- Inserir achievements padrão
INSERT INTO achievements (name, description, category, requirement_value, icon) VALUES
  -- Quests
  ('Primeira Quest', 'Complete sua primeira quest', 'quests', 1, '🎯'),
  ('Explorador', 'Complete 5 quests', 'quests', 5, '🗺️'),
  ('Aventureiro', 'Complete 10 quests', 'quests', 10, '⚔️'),
  ('Herói', 'Complete 25 quests', 'quests', 25, '🦸'),
  ('Lenda', 'Complete 50 quests', 'quests', 50, '👑'),
  
  -- XP
  ('Primeiros Passos', 'Ganhe 100 XP', 'xp', 100, '👣'),
  ('Explorador de XP', 'Ganhe 500 XP', 'xp', 500, '💰'),
  ('Caçador de XP', 'Ganhe 1000 XP', 'xp', 1000, '💎'),
  ('Mestre do XP', 'Ganhe 2500 XP', 'xp', 2500, '🏆'),
  ('Lendário', 'Ganhe 5000 XP', 'xp', 5000, '⭐'),
  
  -- Streak
  ('Primeiro Dia', 'Conquiste sua primeira streak', 'streak', 1, '🔥'),
  ('Em Chamas', 'Chegue a uma streak de 3 dias', 'streak', 3, '🔥🔥'),
  ('Inquebrável', 'Chegue a uma streak de 7 dias', 'streak', 7, '💪'),
  ('Mestre da Consistência', 'Chegue a uma streak de 30 dias', 'streak', 30, '🏅'),
  
  -- Objetivos
  ('Primeiro Objetivo', 'Crie seu primeiro objetivo NLP', 'objectives', 1, '🎯'),
  ('Focado', 'Crie 5 objetivos NLP', 'objectives', 5, '🎯🎯'),
  ('Dedicado', 'Crie 10 objetivos NLP', 'objectives', 10, '🎯🎯🎯')
ON CONFLICT DO NOTHING;
