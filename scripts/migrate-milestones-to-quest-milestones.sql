-- Migração: milestones → quest_milestones
-- Execute se seu banco tem a tabela "milestones" e quer padronizar em quest_milestones

-- 1. Renomear tabela (preserva dados e índices)
ALTER TABLE IF EXISTS milestones RENAME TO quest_milestones;

-- 2. Adicionar order_index se não existir (opcional)
ALTER TABLE quest_milestones ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
