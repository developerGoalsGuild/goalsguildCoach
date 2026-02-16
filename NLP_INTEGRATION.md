# 🦅 GoalsGuild Coach - NLP Well-Formed Outcomes Integration

## 🎯 O Que Foi Implementado

Sistema completo de **NLP Well-Formed Outcomes** integrado ao MVP do GoalsGuild Coach, baseado nas melhores práticas de coaching com Programação Neurolinguística.

---

## 📋 **8 Critérios de Well-Formed Outcomes**

1. **POSITIVO** → O que o usuário QUER (nunca o que não quer)
2. **SENSORIAL** → O que VÊ, OUVE e SENTE quando tem o objetivo
3. **COMPELLING** → O objetivo PUXA o usuário (atraente, não obrigação)
4. **ECOLOGIA** → Funciona em TODAS as áreas da vida (família, saúde, finanças, etc.)
5. **SELF-INITIATED** → Sob controle total do usuário
6. **CONTEXTUALIZADO** → ONDE, QUANDO, COM QUEM
7. **RECURSOS** → O que PRECISA (interno e externo)
8. **EVIDÊNCIA** → Como vai SABER que conseguiu

---

## 🗂️ **Arquivos Criados/Modificados**

### **NOVOS:**

1. **`app/api/objectives/route.js`** - API para criar/listar objetivos NLP
2. **`app/api/objectives/[id]/route.js`** - API para buscar/atualizar/deletar objetivo específico
3. **`app/api/coach/nlp-goal/route.js`** - API especial de conversação NLP com coach
4. **`app/nlp-goal/page.js`** - Página de interface para definição de objetivo
5. **`app/components/QuickActions.js`** - Componente de ações rápidas na home

### **MODIFICADOS:**

1. **`app/lib/db.js`** - Schema do DB expandido com tabelas `nlp_objectives` e `nlp_objective_details`
2. **`app/lib/openai.js`** - System prompt do coach atualizado com framework NLP
3. **`app/page.js`** - Home page atualizada com botão "Definir Objetivo NLP"

---

## 🗄️ **Schema do Banco de Dados**

### **Tabela: `nlp_objectives`**
```sql
- id (PK)
- session_id (FK)
- status (active/completed/archived)
- created_at
- updated_at
```

### **Tabela: `nlp_objective_details`**
```sql
- id (PK)
- objective_id (FK)
- statement (O que quer em positivo)
- context_when (Quando)
- context_where (Onde)
- context_who (Com quem)
- sensory_visual (O que vê)
- sensory_auditory (O que ouve)
- sensory_kinesthetic (O que sente)
- compelling_factor (Por que puxa)
- ecology_family_impact (Impacto na família)
- ecology_family_resolution (Como foi resolvido)
- ecology_health_impact (Impacto na saúde)
- ecology_health_resolution (Como foi resolvido)
- ecology_finance_impact (Impacto nas finanças)
- ecology_finance_resolution (Como foi resolvido)
- ecology_other (Outros impactos)
- self_initiated_control (O que está no controle)
- self_initiated_not_in_control (O que não está no controle)
- resources_internal (array de recursos internos)
- resources_external (array de recursos externos)
- evidence_i_will_know (Como vou saber)
- evidence_others_will_see (O que outros vão ver)
- evidence_metrics (Métricas concretas)
- timeline_start (Data de início)
- timeline_target (Data alvo)
- timeline_checkpoints (array de checkpoints)
- coaching_notes (Observações da sessão)
```

---

## 🔄 **Fluxo de Conversação NLP**

### **Fase 1: Clarificação Inicial**
- "O que você quer?"
- "Onde você está hoje em relação a isso?"
- "O que isso vai te dar?"

### **Fase 2: Well-Formed Outcomes (8 perguntas)**

#### **1. Positivo**
Pergunta: "Pode me dizer em uma frase o que você quer, usando apenas o que você DESEJA?"

#### **2. Sensorial**
Pergunta: "Feche os olhos. Imagine que já tem isso. O que você VÊ, OUVE e SENTE no corpo?"

#### **3. Compelling**
Pergunta: "Essa imagem PUXA você ou é uma obrigação? É empolgante ou chato?"

#### **4. Ecologia**
Pergunta: "Vamos olhar sua vida inteira. Como isso afeta sua família? Saúde? Finanças? O que você GANHA? O que você PERDE?"

#### **5. Self-Initiated**
Pergunta: "O que depende de VOCÊ para conseguir isso? O que está 100% no seu controle?"

#### **6. Contextualizado**
Pergunta: "QUANDO você quer isso? ONDE? COM QUEM?"

#### **7. Recursos**
Pergunta: "O que você PRECISA para conseguir isso? Quem você precisa SER? Já fez algo parecido antes?"

#### **8. Evidência**
Pergunta: "Como você vai SABER que conseguiu? O que vai ser diferente?"

### **Fase 3: Resolução de Fricções Ecológicas**

Se identificar conflito em qualquer área da vida:

1. **IDENTIFIQUE:** "Notei que isso pode [conflito]. Como lidar com isso?"
2. **EXPLIQUE IMPACTO:** Breve e claro
3. **OFEREÇA OPÇÕES** (sempre 2-3 alternativas):
   - Opção A: Solução conservadora
   - Opção B: Solução equilibrada
   - Opção C: Solução ousada
4. **PERGUNTE:** "Qual dessas funciona para você?"
5. **ACEITE:** "Entendido. Vamos com [opção escolhida]."

### **Fase 4: Finalização**

- Confirma todos os 8 pontos
- Pergunta: "Isso soa certo para você?"
- Se SIM → Salva objetivo formatado
- Se NÃO → Itera no feedback, ajusta, pergunta novamente

---

## 🎨 **Interface do Usuário**

### **Página: `/nlp-goal`**

- **Chat em tempo real** com coach NLP
- **Indicador de fase atual** (qual critéio está sendo trabalhado)
- **Lista de critérios** na sidebar (destacando o atual)
- **Input de texto** para respostas
- **Botão de envio** (desabilitado durante loading)
- **Salvamento automático** ao finalizar

### **Página: `/` (Home)**

- **Botão "Definir Objetivo NLP"** em destaque (amarelo)
- **Componente QuickActions** com 3 ações principais:
  - 🎯 Definir Objetivo NLP
  - 🗺 Criar Nova Quest
  - ✅ Adicionar Task

---

## 🤖 **System Prompt do Coach**

O coach agora inclui explicitamente:

**Framing de NLP Well-Formed Outcomes:**
- 8 critérios documentados
- Fluxo conversacional bem definido
- Exemplos de resolução de fricções
- Formato de salvamento de objetivo

**Diferencial:**
- Não é apenas um coach de produtividade
- É um **coach NLP especializado** em definição de objetivos
- Usa jargão de "quests" mas com profundidade psicológica
- Conecta definição de objetivos com quests/tasks

---

## 📊 **APIs Disponíveis**

### **GET `/api/objectives`**
Lista todos os objetivos do usuário logado

**Response:**
```json
{
  "objectives": [
    {
      "id": 1,
      "status": "active",
      "created_at": "2026-02-12T12:00:00Z",
      "updated_at": "2026-02-12T12:00:00Z",
      "statement": "Correr 5km, 3x/semana",
      "context_when": "ter, qui, sex à noite",
      "timeline_target": "2026-05-12",
      "evidence_i_will_know": "Vou correr sem parar, roupas vão folgar"
    }
  ]
}
```

### **POST `/api/objectives`**
Cria novo objetivo NLP

**Body:**
```json
{
  "statement": "Correr 5km, 3x/semana",
  "context_when": "ter, qui, sex à noite",
  "context_where": "Parque perto de casa",
  "context_who": "Com meu cachorro",
  "sensory_visual": "Roupas que nem cabiam folgando",
  "sensory_auditory": "Esposa dizendo 'você tá bem'",
  "sensory_kinesthetic": "Leveza, disposição, sono melhor",
  "compelling_factor": "Me sinto bem, exemplo para família",
  "ecology_family_impact": null,
  "ecology_family_resolution": "3 dias fixos, esposa entende 'eu time'",
  "ecology_health_impact": null,
  "ecology_health_resolution": "Sono melhor, energia",
  "ecology_finance_impact": null,
  "ecology_finance_resolution": null,
  "ecology_other": null,
  "self_initiated_control": "Tênis e horário",
  "self_initiated_not_in_control": null,
  "resources_internal": ["Disciplina", "Motivação"],
  "resources_external": ["Tênis bom", "Parque perto", "Cachorro"],
  "evidence_i_will_know": "Roupas folgam, corro 5km sem parar, esposa comenta",
  "evidence_others_will_see": "Família nota melhora",
  "evidence_metrics": "5km sem parar",
  "timeline_start": "2026-02-12",
  "timeline_target": "2026-05-12",
  "timeline_checkpoints": ["Março", "Abril", "Maio"],
  "coaching_notes": "Usuário empolgado, família alinhada"
}
```

### **GET `/api/objectives/[id]`**
Busca objetivo completo por ID

### **PATCH `/api/objectives/[id]`**
Atualiza objetivo existente

### **DELETE `/api/objectives/[id]`**
Deleta objetivo

### **GET `/api/coach/nlp-goal`**
Inicia sessão de definição de objetivo NLP

### **POST `/api/coach/nlp-goal`**
Continua processo de definição com NLP

---

## 🚀 **Como Usar**

### **Passo 1: Iniciar Sessão NLP**
1. Usuário clica em "Definir Objetivo NLP" na home
2. Sistema abre página `/nlp-goal`
3. Coach inicia: "Legal! Vamos estruturar isso. O que você quer?"

### **Passo 2: Conversar com Coach**
1. Usuário responde pergunta
2. Coach analisa resposta e faz próxima pergunta
3. Processo continua pelos 8 critérios
4. Coach identifica fricções e oferece soluções

### **Passo 3: Confirmação**
1. Coach resume todos os pontos
2. Pergunta: "Isso soa certo para você?"
3. Usuário confirma
4. Sistema salva objetivo formatado no banco

### **Passo 4: Transformar em Quests**
1. Objetivo salvo → Usuário pode criar quests
2. Coach ajuda a quebrar objetivo em milestones
3. Cada milestone vira uma task diária

---

## 🎯 **Diferencial Competitivo**

### **Vs Habitica:**
- Habitica: Gamificação pesada (badges, XP, levels)
- Nós: Coaching profundo + gamificação light
- **Diferencial:** Objetivos bem formados psicologicamente

### **Vs Emergent/Friendware:**
- Eles: Insights automáticos de dados
- Nós: Coaching conversacional + NLP
- **Diferencial:** Coach que conversa e guia

### **Vs Pattrn:**
- Eles: AI interpreta comportamento
- Nós: Well-Formed Outcomes (NLP) + Quests
- **Diferencial:** Estrutura de objetivos com profundidade psicológica

---

## 📝 **Próximos Passos Sugeridos**

1. **Testar com usuários reais** → Ver se funciona na prática
2. **Adicionar checkpoints automáticos** → Coach checa progresso semanalmente
3. **Gerar relatórios de objetivos** → Mostrar evolução dos 8 critérios
4. **Integrar com quests/tasks** → Criar quests a partir de objetivos NLP automaticamente
5. **Adicionar modos de persona** = "agressive", "gentle", "warm", "sharp"
6. **Sistema de notificações** → Lembretes sobre prazos de objetivos

---

## 🔧 **Como Rodar**

```bash
cd /home/node/.openclaw/workspace/goalsguild-coach
npm run dev
```

Acesse: http://localhost:3002

---

**Status:** ✅ Implementação completa e testada

**Data:** 12/02/2026

**Versão:** MVP v2.0 + NLP Well-Formed Outcomes
