-- ============================================
-- objective_memories - Memórias de objetivos NLP
-- ============================================
-- Armazena o resumo formatado de objetivos NLP
-- para contexto do Coach em conversas futuras
-- ============================================

CREATE TABLE IF NOT EXISTS objective_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  memory TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_objective_memories_objective ON objective_memories(objective_id);
CREATE INDEX IF NOT EXISTS idx_objective_memories_session ON objective_memories(session_id);
