-- ============================================
-- UNIFICAÇÃO: goals + nlp_objectives
-- ============================================
-- Merge das tabelas goals e nlp_objectives
-- em uma única tabela unificada
-- ============================================

-- 1. Adicionar campos NLP à tabela goals
ALTER TABLE goals ADD COLUMN IF NOT EXISTS statement TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_positive TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_sensory TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_compelling TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_ecology TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_self_initiated TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_context TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_resources TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS nlp_criteria_evidence TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_nlp_complete BOOLEAN DEFAULT FALSE;

-- 2. Migrar dados de nlp_objectives para goals
INSERT INTO goals (
  session_id,
  title,
  description,
  statement,
  category,
  nlp_criteria_positive,
  nlp_criteria_sensory,
  nlp_criteria_compelling,
  nlp_criteria_ecology,
  nlp_criteria_self_initiated,
  nlp_criteria_context,
  nlp_criteria_resources,
  nlp_criteria_evidence,
  is_nlp_complete,
  target_date,
  status,
  created_at
)
SELECT 
  no.session_id,
  COALESCE(no.statement, 'Sem título') as title,
  COALESCE(no.statement, '') as description,
  nod.statement,
  no.category,
  nod.criteria_1 as nlp_criteria_positive,
  nod.criteria_2 as nlp_criteria_sensory,
  nod.criteria_3 as nlp_criteria_compelling,
  nod.ecology as nlp_criteria_ecology,
  nod.alignment as nlp_criteria_self_initiated,
  nod.resources as nlp_criteria_context,
  nod.resources as nlp_criteria_resources,
  nod.evidence as nlp_criteria_evidence,
  TRUE as is_nlp_complete,
  CURRENT_DATE as target_date,
  no.status,
  no.created_at
FROM nlp_objectives no
LEFT JOIN nlp_objective_details nod ON no.id = nod.objective_id
WHERE NOT EXISTS (
  SELECT 1 FROM goals g 
  WHERE g.session_id = no.session_id 
  AND g.created_at = no.created_at
);

-- 3. Criar comentários na tabela
COMMENT ON TABLE goals IS 'Unified goals table - combines simple goals and NLP objectives';
COMMENT ON COLUMN goals.statement IS 'NLP: Main statement of the objective';
COMMENT ON COLUMN goals.category IS 'NLP: Category (health, learning, career, etc.)';
COMMENT ON COLUMN goals.nlp_criteria_positive IS 'NLP Criteria 1: Positive (what you WANT)';
COMMENT ON COLUMN goals.nlp_criteria_sensory IS 'NLP Criteria 2: Sensory (see, hear, feel)';
COMMENT ON COLUMN goals.nlp_criteria_compelling IS 'NLP Criteria 3: Compelling (motivating)';
COMMENT ON COLUMN goals.nlp_criteria_ecology IS 'NLP Criteria 4: Ecology (impact on life areas)';
COMMENT ON COLUMN goals.nlp_criteria_self_initiated IS 'NLP Criteria 5: Self-Initiated (under your control)';
COMMENT ON COLUMN goals.nlp_criteria_context IS 'NLP Criteria 6: Context (when, where, who)';
COMMENT ON COLUMN goals.nlp_criteria_resources IS 'NLP Criteria 7: Resources (what you need)';
COMMENT ON COLUMN goals.nlp_criteria_evidence IS 'NLP Criteria 8: Evidence (how you know)';
COMMENT ON COLUMN goals.is_nlp_complete IS 'TRUE if all 8 NLP criteria are collected';

