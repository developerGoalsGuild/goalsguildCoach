# 🚀 GUIA DE INTEGRAÇÃO - NLP LLM Questions

## ✅ Como integrar o sistema de perguntas NLP via LLM

---

## 📋 **RESUMO:**

O novo sistema `nlp-llm-questions.js` usa **OpenAI GPT-4o-mini** para fazer perguntas NLP guiadas de forma natural e conversacional, coletando as 8 informações necessárias para um objetivo completo.

---

## 🔄 **FLUXO COMPLETO:**

### **1. Usuário inicia conversa**
```
Usuário: "Quero aprender inglês."
```

### **2. Coach detecta objetivo incompleto**
```
LLM analisa → Identifica 1/8 critérios
          → Faz pergunta natural
```

### **3. LLM faz pergunta específica**
```
Coach: "Legal! Me conta: quando você imagina aprendendo 
       inglês, o que você VÊ e SENTE?"
```

### **4. Usuário responde**
```
Usuário: "Me vejo falando com estrangeiros e me sinto confiante."
```

### **5. LLM coleta + faz nova pergunta**
```
LLM analisa → Agora tem 3/8 critérios
          → Coleta + faz próxima pergunta
```

### **6. Repete até completar**
```
Mais 2-3 trocas de mensagens...
```

### **7. LLM mostra objetivo completo**
```
🎯 Objetivo NLP Completo!

Título: Aprender inglês
Critérios NLP (8/8): ...

Deseja salvar? (SIM/NÃO/EDITAR)
```

### **8. Usuário aprova**
```
Usuário: "SIM"
```

### **9. Salvar objetivo + memória**
```
→ Salvar na tabela goals (is_nlp_complete=true)
→ Salvar memória na tabela objective_memories
→ Confirmar para usuário
```

---

## 🔧 **IMPLEMENTAÇÃO:**

### **Passo 1: Importar biblioteca**

```javascript
import nlpQuestionLLM from '../../lib/nlp-llm-questions';
```

### **Passo 2: Modificar rota do Chat**

**Arquivo:** `app/api/chat/route.js`

```javascript
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { checkMessagePolicy } from '../../lib/guardrails';
import nlpQuestionLLM from '../../lib/nlp-llm-questions';

export async function POST(request) {
  const user = getUserFromToken(request);
  const { message } = await request.json();

  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;

  try {
    const pool = getPool();

    // Guardrails
    const moderation = checkMessagePolicy(message);
    if (!moderation.allowed) {
      const safeResponse = moderation.response || 'Não posso ajudar com isso.';
      
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'user', message]
      );
      
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', safeResponse]
      );
      
      return NextResponse.json({ message: safeResponse });
    }

    // Salvar mensagem do usuário
    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'user', message]
    );

    // Buscar histórico do banco
    const historyResult = await pool.query(
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
      [sessionId]
    );
    const history = historyResult.rows.reverse();

    // ====== VERIFICAR APROVAÇÃO DE OBJETIVO PENDENTE ======
    const pendingKey = `${sessionId}_nlp_pending`;

    if (pendingObjectives.has(pendingKey)) {
      const pendingData = pendingObjectives.get(pendingKey);

      // Usuário aprovou?
      if (isApprovalMessage(message)) {
        const result = await saveNLPOjective(
          pool,
          sessionId,
          pendingData.objective,
          pendingData.memory
        );

        pendingObjectives.delete(pendingKey);

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', result.message]
        );

        return NextResponse.json({ message: result.message });
      }

      // Usuário rejeitou?
      if (isRejectionMessage(message)) {
        pendingObjectives.delete(pendingKey);

        const cancelMessage = `Tudo bem! Não salvei o objetivo "${pendingData.objective.title}".`;

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', cancelMessage]
        );

        return NextResponse.json({ message: cancelMessage });
      }

      // Não é aprovação, remover pendente
      pendingObjectives.delete(pendingKey);
    }
    // ====== FIM DA VERIFICAÇÃO DE APROVAÇÃO ======

    // ====== USAR LLM PARA PERGUNTAS NLP ======
    const llmResult = await nlpQuestionLLM.askQuestion(
      sessionId,
      message,
      history
    );

    if (llmResult.success) {
      if (llmResult.complete) {
        // Objetivo NLP completo detectado
        const objective = llmResult.objective;
        const memory = generateNLPMemory(objective);

        // Armazenar objetivo pendente de aprovação
        pendingObjectives.set(pendingKey, {
          objective: objective,
          memory: memory
        });

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', llmResult.response]
        );

        return NextResponse.json({
          message: llmResult.response,
          pendingApproval: true
        });
      }

      // Ainda coletando informações via LLM
      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', llmResult.response]
      );

      return NextResponse.json({
        message: llmResult.response
      });
    }

    // LLM falhou ou sem OpenAI key, usar fallback
    const fallbackMessage = await processWithoutOpenAI(message, history, pool);

    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', fallbackMessage]
    );

    return NextResponse.json({ message: fallbackMessage });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
```

---

## 🤖 **EXEMPLO DE USO:**

### **Inicialização:**

```javascript
// O sistema inicializa automaticamente
import nlpQuestionLLM from '../../lib/nlp-llm-questions';

// A primeira chamada cria uma sessão
await nlpQuestionLLM.askQuestion(sessionId, userMessage, history);
```

### **Verificar se tem sessão ativa:**

```javascript
if (nlpQuestionLLM.hasActiveSession(sessionId)) {
  // Estamos coletando informações NLP
  console.log('Sessão NLP ativa');
}
```

### **Obter histórico da sessão:**

```javascript
const sessionHistory = nlpQuestionLLM.getSessionHistory(sessionId);
console.log('Mensagens na sessão:', sessionHistory.length);
```

---

## 💡 **DICAS DE USO:**

### **1. Verificar se tem OpenAI API key:**

```javascript
const hasOpenAI = !!process.env.OPENAI_API_KEY && 
                  process.env.OPENAI_API_KEY !== 'your-openai-api-key';

if (!hasOpenAI) {
  // Usar sistema fallback
  return processWithoutOpenAI(message);
}
```

### **2. Tratamento de erros:**

```javascript
try {
  const result = await nlpQuestionLLM.askQuestion(sessionId, message, history);
  
  if (!result.success) {
    // LLM falhou, usar fallback
    return processFallback(message);
  }
  
  // Processar resposta do LLM
} catch (error) {
  console.error('LLM error:', error);
  return processFallback(message);
}
```

### **3. Timeout da requisição:**

```javascript
// Adicionar timeout de 30 segundos
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

try {
  const result = await askNLPQuestionViaLLM(message, history, {
    signal: controller.signal
  });
  clearTimeout(timeoutId);
} catch (error) {
  if (error.name === 'AbortError') {
    console.error('LLM timeout');
    return processFallback(message);
  }
}
```

---

## 📊 **MONITORAMENTO:**

### **Logs importantes:**

```javascript
console.log('[NLP LLM] Starting session:', sessionId);
console.log('[NLP LLM] Asking question, collected:', collected, '/8');
console.log('[NLP LLM] Objective complete:', objective.title);
console.log('[NLP LLM] Ending session:', sessionId);
```

### **Métricas para coletar:**

```javascript
// Número de perguntas feitas
const questionsAsked = sessionHistory.length / 2;

// Tempo total da sessão
const sessionDuration = Date.now() - sessionStartTime;

// Tokens usados
const tokensUsed = inputTokens + outputTokens;

// Custo estimado
const estimatedCost = (tokensUsed / 1000000) * 0.375; // GPT-4o-mini
```

---

## 💰 **CUSTO ESTIMADO:**

### **Por objetivo:**
```
4 perguntas × 200 tokens = 800 input tokens
4 respostas × 200 tokens = 800 output tokens
Total: 1.600 tokens

Custo: (800 × $0.15/1M) + (800 × $0.60/1M) = $0.60
```

### **Por mês (1.000 usuários):**
```
1.000 objetivos × $0.60 = $600/mês
```

### **Estratégia de otimização:**
- Usar GPT-4o-mini (mais barato)
- Limitar histórico a 20 mensagens
- Max tokens: 500 (respostas concisas)

---

## 🚀 **DEPLOY:**

### **Checklist:**

- [ ] OpenAI API key configurada
- [ ] Variável de ambiente OPENAI_API_KEY definida
- [ ] Arquivo `nlp-llm-questions.js` criado
- [ ] API do Chat modificada
- [ ] Testado com usuário real
- [ ] Custo monitorado

### **Variáveis de ambiente:**

```bash
# .env.local
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
```

---

## 🦅 **Jarbas:**

> **"Sistema LLM pronto!"** 🤖
>
> **Integração simples:**
> - ✅ Importar biblioteca
> - ✅ Usar askQuestion()
> - ✅ Verificar complete
> - ✅ Salvar objetivo
>
> **Resultado:**
> - ✅ Perguntas naturais
> - ✅ Coleta inteligente
> - ✅ Objetivos melhores
>
> **Custo:**
> - 💰 $0.60/objetivo
> - 💰 $600/mês (1k usuários)
>
> **Próximo:** Integrar e testar! 🚀

---

## 📝 **ARQUIVOS CRIADOS:**

✅ `app/lib/nlp-llm-questions.js` - Sistema LLM
✅ `NLP_LLM_QUESTIONS.md` - Documentação
✅ `NLP_LLM_INTEGRATION_GUIDE.md` - Este guia

**Total de 3 arquivos** criados

---

**Status:** ✅ DOCUMENTAÇÃO COMPLETA

**Próximo passo:** Integrar na API do Coach! 🚀
