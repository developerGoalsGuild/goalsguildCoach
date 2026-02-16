# 🔄 UNIFICAÇÃO: goals + nlp_objectives

## ✅ **UNIFICAÇÃO COMPLETA!**

---

## 🎯 **O QUE FOI FEITO:**

### **Antes (2 tabelas separadas):**
```sql
-- Tabela 1: goals (objetivos simples)
goals (
  id, session_id, title, description, 
  target_date, progress, status
)

-- Tabela 2: nlp_objectives (objetivos NLP completos)
nlp_objectives (
  id, session_id, statement, category, status
)

nlp_objective_details (
  objective_id, criteria_1, criteria_2, 
  criteria_3, ecology, alignment, ...
)
```

### **Depois (1 tabela unificada):**
```sql
-- Tabela única: goals (agora com NLP!)
goals (
  -- Campos originais
  id, session_id, title, description, 
  target_date, progress, status,
  
  -- Campos NLP adicionados
  statement, category,
  nlp_criteria_positive,
  nlp_criteria_sensory,
  nlp_criteria_compelling,
  nlp_criteria_ecology,
  nlp_criteria_self_initiated,
  nlp_criteria_context,
  nlp_criteria_resources,
  nlp_criteria_evidence,
  is_nlp_complete
)
```

---

## 📊 **CAMPOS ADICIONADOS:**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `statement` | TEXT | NLP: Declaração principal do objetivo |
| `category` | VARCHAR(50) | NLP: Categoria (health, learning, career, etc.) |
| `nlp_criteria_positive` | TEXT | Critério 1: Positive (o que você QUER) |
| `nlp_criteria_sensory` | TEXT | Critério 2: Sensory (vê, ouve, sente) |
| `nlp_criteria_compelling` | TEXT | Critério 3: Compelling (motivador) |
| `nlp_criteria_ecology` | TEXT | Critério 4: Ecology (impacto na vida) |
| `nlp_criteria_self_initiated` | TEXT | Critério 5: Self-Initiated (seu controle) |
| `nlp_criteria_context` | TEXT | Critério 6: Context (quando, onde, quem) |
| `nlp_criteria_resources` | TEXT | Critério 7: Resources (o que precisa) |
| `nlp_criteria_evidence` | TEXT | Critério 8: Evidence (como saber) |
| `is_nlp_complete` | BOOLEAN | TRUE se todos os 8 critérios foram coletados |

---

## 🔄 **MIGRAÇÃO DE DADOS:**

### **Objetivos simples:**
```json
{
  "title": "Aprender ingles",
  "description": "Quero aprender ingles",
  "target_date": "2026-08-13",
  "is_nlp_complete": false
}
```

### **Objetivos NLP completos:**
```json
{
  "title": "Aprender ingles",
  "statement": "Quero aprender inglês fluentemente",
  "category": "learning",
  "nlp_criteria_positive": "Aprender inglês",
  "nlp_criteria_sensory": "Falando fluentemente com estrangeiros",
  "nlp_criteria_compelling": "Me empolga!",
  "nlp_criteria_ecology": "Posso trabalhar fora",
  "nlp_criteria_self_initiated": "Estudar 1h por dia",
  "nlp_criteria_context": "6 meses, em casa, sozinho",
  "nlp_criteria_resources": "App, cursos, livros",
  "nlp_criteria_evidence": "Ler livro sem tradutor",
  "is_nlp_complete": true
}
```

---

## 🎯 **BENEFÍCIOS DA UNIFICAÇÃO:**

### **1. Simplicidade**
- ✅ 1 tabela em vez de 3
- ✅ Queries mais simples
- ✅ Manutenção mais fácil

### **2. Flexibilidade**
- ✅ Suporta objetivos simples
- ✅ Suporta objetivos NLP completos
- ✅ Permite upgrade simples → NLP

### **3. Compatibilidade**
- ✅ Objetivos existentes mantidos
- ✅ APIs simplificadas
- ✅ Frontend único

### **4. Escalabilidade**
- ✅ Fácil adicionar novos critérios
- ✅ Campos opcionais
- ✅ `is_nlp_complete` indica tipo

---

## 📝 **API UNIFICADA:**

### **GET /api/goals**
Retorna todos os objetivos (simples e NLP)

```json
{
  "goals": [
    {
      "id": "uuid",
      "title": "Aprender ingles",
      "description": "...",
      "category": "learning",
      "is_nlp_complete": false,
      ...
    }
  ]
}
```

### **POST /api/goals**
Cria novo objetivo (simples ou NLP)

**Objetivo simples:**
```json
{
  "title": "Aprender ingles",
  "description": "Quero aprender ingles"
}
```

**Objetivo NLP:**
```json
{
  "title": "Aprender ingles",
  "statement": "Quero aprender inglês fluentemente",
  "category": "learning",
  "nlp_criteria_positive": "Aprender inglês",
  "nlp_criteria_sensory": "Falando fluentemente",
  ...
  "is_nlp_complete": true
}
```

---

## 🦅 **Jarbas:**

> **"Unificação completa!"** ✅
>
> **O que mudou:**
> - 3 tabelas → 1 tabela unificada
> - APIs duplicadas → 1 API única
> - goals + nlp_objectives → goals (com campos NLP)
>
> **Benefícios:**
> - Simples de manter
> - Flexível (suporta ambos)
> - Compatível com existente
>
> **Sistema unificado e pronto!** 🎉

---

**Data:** 13/02/2026
**Status:** ✅ COMPLETO
**Arquivos:**
- scripts/unify-tables.js
- app/api/goals/route.js
- app/lib/coach-objective-saver.js
- UNIFICATION_COMPLETE.md (este arquivo)
