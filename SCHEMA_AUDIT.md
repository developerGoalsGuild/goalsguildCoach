# Auditoria de Schema - Divergências SQL vs Banco

**Data:** 2025-02-14  
**Banco:** goalsguild (PostgreSQL)

## Schema real do banco (tabelas principais)

| Tabela | Colunas |
|--------|---------|
| **goals** | id, session_id, parent_quest_id, title, description, target_date, progress, status, created_at, statement, category, nlp_criteria_*, is_nlp_complete |
| **quests** | id, session_id, parent_goal_id, title, description, difficulty, status, current_xp, estimated_xp, created_at, completed_at |
| **quest_milestones** | id, quest_id, title, description, status, completed_at, created_at [, order_index] |
| **tasks_table** | id, session_id, quest_id, title, description, status, priority, estimated_hours, completed_at, created_at |
| **messages** | id, session_id, role, content, created_at |
| **objective_memories** | id, objective_id, session_id, memory, created_at |

## Divergências críticas

### 1. quests – colunas inexistentes
O código usa colunas que **não existem** no banco:
- `quest_type` ❌
- `xp_reward` ❌ (existe `estimated_xp`)
- `start_date` ❌
- `target_date` ❌
- `user_id` ❌ (existe `session_id`)

**Status:** Corrigido em `create-quest-from-objective.js` com INSERT dinâmico.

### 2. milestones vs quest_milestones
- **Banco:** tabela `milestones`
- **Código:** usa `quest_milestones` em vários arquivos

**Arquivos afetados:**
- `app/lib/create-quest-from-objective.js` – INSERT em quest_milestones
- `app/api/quests/from-objective/route.js` – INSERT em quest_milestones
- `app/api/milestones/[id]/route.js` – UPDATE/DELETE em quest_milestones
- `app/api/quests/[id]/route.js` – JOIN com quest_milestones
- `app/api/quests/route.js` – subquery em quest_milestones

### 3. milestones – coluna order_index
- **Banco:** tabela `milestones` **não tem** `order_index`
- **Código:** INSERT usa `order_index`

### 4. tasks vs tasks_table
- **Banco:** tabela `tasks_table` com `session_id`
- **Código:** usa `tasks` com `user_id`

**Arquivos afetados:**
- `app/api/tasks/route.js` – SELECT/INSERT em tasks
- `app/api/tasks/[id]/route.js` – UPDATE/DELETE em tasks
- `app/api/stats/route.js` – SELECT em tasks
- `app/api/quests/[id]/route.js` – SELECT tasks

### 5. goals / quests – user_id vs session_id
- **Banco:** `goals` e `quests` usam `session_id`
- **Código:** várias rotas usam `user_id` (stats, quests/[id], active-quest)

## Resumo de correções aplicadas

| Prioridade | Item | Status |
|------------|------|--------|
| Alta | quests INSERT | ✅ create-quest-from-objective.js (colunas dinâmicas) |
| Alta | milestones INSERT | ✅ Detecta quest_milestones/milestones, order_index opcional |
| Alta | quest_milestones → milestones | ✅ db-schema.js + rotas atualizadas |
| Média | tasks → tasks_table | ✅ db-schema.js + tasks route |
| Média | user_id → session_id | ✅ COLS.questsUser, COLS.goalsUser |
| Média | active-quest status | ✅ 'in_progress' em vez de 'active' |

## Como rodar a auditoria

```bash
node scripts/audit-schema.js
```
