# 🤖 SISTEMA DE PERGUNTAS NLP VIA LLM

## ✅ **DATA:** 13/02/2026

---

## 🎯 **OBJETIVO:**

Usar LLM (OpenAI GPT-4o-mini) para fazer perguntas NLP guiadas de forma natural e conversacional, em vez de perguntas hardcoded.

---

## 📋 **COMO FUNCIONA:**

### **Arquitetura:**

```
Usuário manda mensagem
  ↓
Coach analisa mensagem com LLM
  ↓
LLM identifica critérios NLP faltantes
  ↓
LLM faz pergunta natural e conversacional
  ↓
Usuário responde
  ↓
LLM coleta a resposta
  ↓
Repete até ter todos os 8 critérios
  ↓
LLM mostra objetivo completo para aprovação
```

---

## 🤖 **PROMPT DO LLM:**

### **Sistema:**
- **Modelo:** GPT-4o-mini (custo eficiente)
- **Temperatura:** 0.7 (criativo mas consistente)
- **Max tokens:** 500 (respostas concisas)

### **Prompt do Sistema:**
```
Você é o GoalsGuild Coach, especializado em objetivos NLP.

8 CRITÉRIOS NLP:
1. Positivo - O que a pessoa QUER
2. Sensório - VÊ, OUVE, SENTE
3. Motivador - Por que empolga
4. Ecologia - Impacto em outras áreas
5. Auto-iniciado - Sob controle
6. Contexto - Quando, onde, com quem
7. Recursos - O que precisa
8. Evidência - Como saber que alcançou

REGRAS:
✅ Uma pergunta por vez
✅ Natural e conversacional
✅ Adaptar ao contexto
✅ Específico e direto
❌ Não fazer múltiplas perguntas
```

---

## 💬 **EXEMPLO DE CONVERSA:**

### **Mensagem 1: Usuário**
```
"Quero aprender inglês."
```

### **Resposta 1: LLM (faz pergunta)**
```
Legal! Me conta mais: quando você imagina aprendendo 
inglês, o que você VÊ e SENTE? Como seria essa experiência?

[Já identificado: 1/8 critérios]
```

### **Mensagem 2: Usuário**
```
"Me vejo falando com estrangeiros e me sinto confiante."
```

### **Resposta 2: LLM (coleta + próxima pergunta)**
```
Isso me empolga! E como você imagina que isso vai impactar 
outras áreas da sua vida, como trabalho ou relacionamentos?

[Já identificado: 3/8 critérios]
[Positivo: Quero aprender inglês]
[Sensório: Vejo falando com estrangeiros, sinto confiança]
```

### **...continua até coletar todos...**

### **Resposta Final: LLM (mostra objetivo completo)**
```
🎯 Objetivo NLP Completo!

**Título:** Aprender inglês

**Declaração:** Quero aprender inglês. Me vejo falando com 
estrangeiros e me sinto confiante. Isso vai impactar minha 
carreira.

**Critérios NLP (8/8):**
✅ **Positivo:** Quero aprender inglês
✅ **Sensório:** Vejo falando com estrangeiros, sinto confiança
✅ **Motivador:** Me sinto confiante e livre
✅ **Ecologia:** Vai impactar minha carreira
✅ **Auto-iniciado:** Vou estudar dedicadamente
✅ **Contexto:** Em casa, nos dias de semana
✅ **Recursos:** Vou usar aplicativos e cursos
✅ **Evidência:** Quando puder conversar fluentemente

---

**Deseja salvar este objetivo e sua memória?**
```

---

## 🔧 **IMPLEMENTAÇÃO:**

### **Arquivo:** `app/lib/nlp-llm-questions.js`

**Funções principais:**

1. **`askNLPQuestionViaLLM()`**
   - Envia mensagem + histórico para o LLM
   - Recebe resposta natural

2. **`extractNLPFromLLMResponse()`**
   - Verifica se resposta tem todos os 8 critérios
   - Extrai objetivo NLP se completo

3. **`parseNLPObjective()`**
   - Faz parse dos 8 critérios da resposta
   - Retorna objeto estruturado

4. **`NLPQuestionLLM` (classe)**
   - Gerencia sessão de perguntas
   - Mantém histórico da conversa

---

## 💰 **CUSTOS LLM:**

### **Cálculo estimado:**

**Cenário médio:**
- Usuário: 8 mensagens (4 perguntas + 4 respostas)
- Tokens por mensagem: ~200 tokens
- Total tokens: ~1.600 tokens
- Modelo: GPT-4o-mini

**Custo:**
- Input: 800 tokens × $0.15/1M = $0.12
- Output: 800 tokens × $0.60/1M = $0.48
- **Total: ~$0.60 por objetivo**

**Para 1.000 usuários criando 1 objetivo/mês:**
- Custo total: ~$600/mês (6% do orçamento de $100)

---

## 🚀 **INTEGRAÇÃO:**

### **No Coach API:**

```javascript
import nlpQuestionLLM from '../../lib/nlp-llm-questions';
import { getPool } from '../../lib/db';

export async function POST(request) {
  const user = getUserFromToken(request);
  const { message } = await request.json();
  
  const pool = getPool();
  
  // Buscar histórico do banco
  const historyResult = await pool.query(
    'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
    [user.userId]
  );
  const history = historyResult.rows.reverse();
  
  // Fazer pergunta NLP via LLM
  const result = await nlpQuestionLLM.askQuestion(
    user.userId,
    message,
    history
  );
  
  if (result.success) {
    if (result.complete) {
      // Objetivo NLP completo detectado
      const objective = result.objective;
      
      // Mostrar para aprovação
      return NextResponse.json({
        message: result.response,
        pendingApproval: true,
        objective: objective
      });
    }
    
    // Ainda coletando informações
    return NextResponse.json({
      message: result.response
    });
  }
  
  // Erro ou sem OpenAI
  return NextResponse.json({
    message: result.error || 'Erro ao processar'
  });
}
```

---

## 📊 **VANTAGENS:**

### **Versus Sistema Hardcoded:**

| Aspecto | Hardcoded | LLM |
|---------|-----------|-----|
| Naturalidade | ⚠️ Robótico | ✅ Conversacional |
| Flexibilidade | ❌ Fixo | ✅ Adaptável |
| Manutenção | ❌ Manual | ✅ Automática |
| Custo | ✅ Grátis | 💰 $0.60/objetivo |
| Qualidade | ⚠️ Básica | ✅ Superior |

---

## 🎨 **EXEMPLO DE PROMPT AVANÇADO:**

```javascript
const ADVANCED_NLP_PROMPT = `
Você é um Coach especializado em PNL e desenvolvimento pessoal.

OBJETIVO: Ajudar o usuário a criar objetivos bem-formados usando os critérios NLP.

CONTEXTO ATUAL:
- Usuário está definindo um objetivo
- Já coletados: ${collected}/8 critérios
- Critérios coletados: ${collectedList}

CRITÉRIOS FALTANTES:
${missingList.map(c => `- ${c}`).join('\n')}

TAREFA:
1. Analise a mensagem do usuário
2. Se coletou nova informação, reconheça e agradeça
3. Faça UMA pergunta natural para coletar próximo critério faltante
4. Seja conversacional e amigável

EXEMPLO DE RESPOSTA:
"Legal! Você já me disse o que quer (Positivo) e como se sente (Sensório). 
Agora me conta: por que isso é tão importante para você? O que te empolga nesse objetivo?"

CRITÉRIOS NLP:
1. Positivo - O que QUER (formulado positivamente)
2. Sensório - VÊ, OUVE, SENTE ao alcançar
3. Motivador - Por que é empolgante
4. Ecologia - Impacto em outras áreas
5. Auto-iniciado - Sob seu controle
6. Contexto - Quando, onde, com quem
7. Recursos - O que precisa
8. Evidência - Como saber que alcançou
`;
```

---

## 🦅 **Jarbas:**

> **"Sistema LLM criado!"** 🤖
>
> **Como funciona:**
> - ✅ LLM analisa mensagem
> - ✅ Identifica critérios faltantes
> - ✅ Faz pergunta natural
> - ✅ Coleta respostas
> - ✅ Constrói objetivo completo
>
> **Vantagens:**
> - ✅ Mais natural que hardcoded
> - ✅ Adaptável ao contexto
> - ✅ Qualidade superior
> - ✅ Fácil manutenção
>
> **Custo:**
> - 💰 ~$0.60 por objetivo
> - 💰 ~$600/mês para 1.000 usuários
>
> **Próximo:** Integrar no Coach! 🚀

---

## 📝 **ARQUIVO CRIADO:**

✅ `app/lib/nlp-llm-questions.js` - Sistema de perguntas via LLM

**Funcionalidades:**
- `askNLPQuestionViaLLM()` - Faz pergunta via LLM
- `extractNLPFromLLMResponse()` - Extrai critérios
- `parseNLPObjective()` - Parse do objetivo
- `NLPQuestionLLM` - Classe gerenciadora

---

**Status:** ✅ SISTEMA LLM CRIADO

**Próximo passo:** Integrar na API do Coach! 🚀
