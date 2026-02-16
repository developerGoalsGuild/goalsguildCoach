# 📝 SISTEMA DE APROVAÇÃO DE OBJETIVOS NLP

## ✅ **DATA:** 13/02/2026

---

## 🎯 **OBJETIVO:**

Salvar objetivos NLP completos APENAS quando o usuário aprovar, mostrando a memória antes de salvar.

---

## 📋 **O QUE FOI MUDADO:**

### **1. NOVO: nlp-objective-saver.js** ✅

**Caminho:** `app/lib/nlp-objective-saver.js`

**Funcionalidades:**
- ✅ Detecta objetivos NLP completos (8 critérios)
- ✅ Requer mínimo de 6 critérios NLP
- ✅ Gera memória formatada do objetivo
- ✅ Salva objetivo e memória separadamente
- ✅ Sistema de aprovação integrado

**8 Critérios NLP:**
1. **Positivo** - O que você QUER
2. **Sensório** - VÊ, OUVE e SENTE
3. **Motivador** - Empolgante para você
4. **Ecologia** - Impacto em outras áreas
5. **Auto-iniciado** - Sob seu controle
6. **Contexto** - Quando, onde, com quem
7. **Recursos** - O que precisa
8. **Evidência** - Como saber que alcançou

---

## 🔄 **FLUXO DE APROVAÇÃO:**

### **Etapa 1: Detecção**
```
Usuário manda mensagem com 6+ critérios NLP
  ↓
Sistema detecta objetivo NLP completo
  ↓
Gera memória formatada
```

### **Etapa 2: Aprovação**
```
Mostra objetivo completo para usuário
  ↓
Usuário vê todos os 8 critérios
  ↓
Usuário pode responder:
- "SIM" → Salvar objetivo + memória
- "NÃO" → Cancelar (não salva)
- "EDITAR" → Modificar algo
```

### **Etapa 3: Salvamento**
```
Se aprovado ("SIM"):
  ↓
Salva objetivo na tabela goals (is_nlp_complete=true)
  ↓
Salva memória na tabela objective_memories
  ↓
Retorna confirmação
```

---

## 📊 **ESTRUTURA DOS DADOS:**

### **Objetivo NLP:**
```javascript
{
  title: "Aprender Inglês",
  description: "Objetivo completo",
  statement: "Quero aprender inglês fluentemente...",
  category: "learning",
  target_date: "2026-08-13",
  is_nlp_complete: true,
  nlp_criteria_positive: "Quero aprender inglês",
  nlp_criteria_sensory: "Vejo falando com estrangeiros",
  nlp_criteria_compelling: "Me empolga muito!",
  nlp_criteria_ecology: "Melhorará minha carreira",
  nlp_criteria_self_initiated: "Estudar 1h por dia",
  nlp_criteria_context: "6 meses, em casa, sozinho",
  nlp_criteria_resources: "App, cursos, livros",
  nlp_criteria_evidence: "Ler livro sem tradutor"
}
```

### **Memória Gerada:**
```markdown
**Objetivo NLP Completo: Aprender Inglês**

📝 **Declaração:**
Quero aprender inglês fluentemente...

✅ **Critérios NLP:**

1. **Positivo:** Quero aprender inglês
2. **Sensório:** Vejo falando com estrangeiros
3. **Motivador:** Me empolga muito!
4. **Ecologia:** Melhorará minha carreira
5. **Auto-iniciado:** Estudar 1h por dia
6. **Contexto:** 6 meses, em casa, sozinho
7. **Recursos:** App, cursos, livros
8. **Evidência:** Ler livro sem tradutor

📅 **Meta:** 13/08/2026

🏷️ **Categoria:** learning

---

**Objetivo criado em:** 13/02/2026
```

---

## 🎨 **EXEMPLO DE USO:**

### **Mensagem do Usuário:**
```
Quero aprender inglês fluentemente em 6 meses. 
Vou estudar 1 hora por dia em casa, usando aplicativos 
e livros. Quando eu puder ler um livro em inglês 
sem precisar de tradutor, sei que consegui! 
Isso me empolga muito e vai ajudar na minha carreira.
```

### **Resposta do Coach:**
```
🎯 **Objetivo NLP Completo Detectado!**

Detectei que você descreveu um objetivo com todos os 
critérios NLP. Aqui está o resumo:

---

**Título:** Aprender inglês fluentemente

**Declaração:** Quero aprender inglês fluentemente...

**Categoria:** learning

**Data Alvo:** 13/08/2026

**Critérios NLP (8/8):**
✅ Quero aprender inglês
✅ Vejo falando com estrangeiros  
✅ Me empolga muito!
✅ Melhorará minha carreira
✅ Estudar 1h por dia
✅ 6 meses, em casa
✅ App, cursos, livros
✅ Ler livro sem tradutor

---

**Deseja salvar este objetivo e sua memória?**

Responda:
- **"SIM"** para salvar
- **"NÃO"** para cancelar
- **"EDITAR"** para modificar algo
```

### **Após "SIM":**
```
✅ **Objetivo NLP salvo com sucesso!**

"Aprender inglês fluentemente"

Agora você pode ver seus objetivos na aba "Objectives".

Quer que eu crie uma quest automática a partir dele?
```

---

## 🔧 **IMPLEMENTAÇÃO:**

### **Arquivos Criados:**

1. **app/lib/nlp-objective-saver.js** (NOVO)
   - `detectNLPOjective()` - Detecta objetivos NLP completos
   - `generateNLPMemory()` - Gera memória formatada
   - `saveNLPOobjective()` - Salva objetivo no banco
   - `saveObjectiveMemory()` - Salva memória no banco
   - `checkAndApproveNLPOobjective()` - Sistema de aprovação
   - `approveAndSaveNLPOobjective()` - Salva após aprovação

2. **app/api/chat/nlp-approval-route.js** (NOVO)
   - Modificado para usar novo sistema
   - Verifica aprovações do usuário
   - Gerencia objetivos pendentes
   - Respostas: "SIM", "NÃO", "EDITAR"

---

## 🦅 **Jarbas:**

> **"Sistema de aprovação criado!"** ✅
>
> **O que mudou:**
> - ✅ Objetivos NLP salvos apenas com aprovação
> - ✅ Memória mostrada antes de salvar
> - ✅ 8 critérios NLP verificados
> - ✅ Mínimo de 6 critérios obrigatório
> - ✅ Fluxo de aprovação claro
>
> **Como funciona:**
> 1. Detecta objetivo NLP completo
> 2. Mostra tudo para usuário
> 3. Usuário aprova ("SIM")
> 4. Salva objetivo + memória
>
> **Próximo:**
> - Integrar na API do Coach
> - Testar fluxo completo
> - Deploy

---

## 📝 **PRÓXIMOS PASSOS:**

1. ✅ Criar `nlp-objective-saver.js`
2. ✅ Criar `nlp-approval-route.js`
3. ⏳ Atualizar `app/api/chat/route.js`
4. ⏳ Testar fluxo completo
5. ⏳ Deploy

---

**Status:** ✅ SISTEMA DE APROVAÇÃO CRIADO

**Próximo:** Integrar na API do Coach e testar! 🚀
