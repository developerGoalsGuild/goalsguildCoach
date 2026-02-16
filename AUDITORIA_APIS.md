# 🔍 AUDITORIA: APIs vs Tabelas Unificadas

## ❌ **PROBLEMAS IDENTIFICADOS:**

### **APIs usando tabelas antigas (nlp_objectives):**

1. **`/api/reminders`** - Reminders
   ```sql
   INNER JOIN nlp_objectives o ON r.objective_id = o.id
   ```
   ❌ Deveria usar: `goals`

2. **`/api/quests/from-objective`** - Criar quest a partir de objetivo
   ```sql
   FROM nlp_objectives o
   INNER JOIN nlp_objective_details d ON o.id = d.objective_id
   ```
   ❌ Deveria usar: `goals`

3. **`/api/daily-summary`** - Resumo diário
   ```sql
   FROM nlp_objectives
   ```
   ❌ Deveria usar: `goals`

4. **`/api/analytics`** - Analytics
   ```sql
   FROM nlp_objectives o
   ```
   ❌ Deveria usar: `goals`

5. **`/api/reports`** - Relatórios
   ```sql
   FROM nlp_objectives o
   ```
   ❌ Deveria usar: `goals`

### **Bibliotecas usando tabelas antigas:**

1. **`app/lib/insights.js`** - Insights de IA
   ```sql
   LEFT JOIN nlp_objectives o ON o.session_id = q.session_id
   SELECT id, statement FROM nlp_objectives
   ```
   ❌ Deveria usar: `goals`

2. **`app/lib/weekly-review.js`** - Revisão semanal
   ```sql
   FROM nlp_objectives o
   INNER JOIN nlp_objectives o ON o.id = qj.quest_id
   ```
   ❌ Deveria usar: `goals`

---

## ✅ **JÁ CORRIGIDO:**

1. ✅ **`/api/goals`** - Lista objetivos (tabela unificada)
2. ✅ **`/api/goals/[id]`** - GET/PATCH/DELETE (tabela unificada)
3. ✅ **`/api/goals/[id]/memory`** - Memory (tabela unificada)
4. ✅ **`app/objectives/page.js`** - Usa `/api/goals`
5. ✅ **`app/nlp-goal/page.js`** - Usa `/api/goals`

---

## 📋 **PRIORIDADE DE CORREÇÃO:**

### **ALTA PRIORIDADE (Quebrando funcionalidades):**

1. **`/api/quests/from-objective`** - Usuário não pode criar quests a partir de objetivos
2. **`/api/reminders`** - Lembretes podem estar quebrados
3. **`/api/analytics`** - Analytics pode não mostrar dados corretos

### **MÉDIA PRIORIDADE (Funcionalidades secundárias):**

4. **`/api/reports`** - Relatórios podem estar incompletos
5. **`/api/daily-summary`** - Resumos diários podem estar incompletos
6. **`app/lib/insights.js`** - Insights podem estar incorretos

### **BAIXA PRIORIDADE (Menos crítico):**

7. **`app/lib/weekly-review.js`** - Revisão semanal pode estar incompleta

---

## 🎯 **PLANO DE AÇÃO:**

**Fase 1:** Atualizar APIs críticas (1-3)
**Fase 2:** Atualizar APIs secundárias (4-6)
**Fase 3:** Atualizar bibliotecas (7)

---

## 📊 **TABELA DE MIGRAÇÃO:**

| Tabela Antiga | Tabela Nova | Campo Correspondente |
|--------------|--------------|---------------------|
| `nlp_objectives.id` | `goals.id` | ✅ MESMO |
| `nlp_objectives.session_id` | `goals.session_id` | ✅ MESMO |
| `nlp_objectives.statement` | `goals.statement` OU `goals.title` | ⚠️ Mapear |
| `nlp_objectives.category` | `goals.category` | ✅ MESMO |
| `nlp_objectives.status` | `goals.status` | ✅ MESMO |
| `nlp_objective_details.criteria_1` | `goals.nlp_criteria_positive` | ⚠️ Renomeado |
| `nlp_objective_details.criteria_2` | `goals.nlp_criteria_sensory` | ⚠️ Renomeado |
| `nlp_objective_details.criteria_3` | `goals.nlp_criteria_compelling` | ⚠️ Renomeado |
| `nlp_objective_details.ecology` | `goals.nlp_criteria_ecology` | ⚠️ Renomeado |
| `nlp_objective_details.alignment` | `goals.nlp_criteria_self_initiated` | ⚠️ Renomeado |
| `nlp_objective_details.resources` | `goals.nlp_criteria_resources` | ⚠️ Renomeado |
| `nlp_objective_details.evidence` | `goals.nlp_criteria_evidence` | ⚠️ Renomeado |

---

**Data:** 13/02/2026
**Status:** 🔄 EM PROGRESSO
**Arquivo:** AUDITORIA_APIS.md
