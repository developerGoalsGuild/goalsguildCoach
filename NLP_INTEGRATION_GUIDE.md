# 🔧 GUIA DE INTEGRAÇÃO - NLP Approval System

## ✅ Como integrar o novo sistema de aprovação de objetivos NLP

---

## 📋 **RESUMO:**

O novo sistema `nlp-objective-saver.js` substitui o antigo `coach-objective-saver.js` e adiciona:

1. **Detecção de objetivos NLP completos** (8 critérios)
2. **Sistema de aprovação** do usuário
3. **Salvamento de memórias**
4. **Mínimo de 6 critérios** para ser NLP completo

---

## 🔄 **MUDANÇAS NECESSÁRIAS:**

### **1. Atualizar imports do Coach**

**Antigo:**
```javascript
import { checkAndSaveObjective } from '../../lib/coach-objective-saver';
```

**Novo:**
```javascript
import { 
  checkAndApproveNLPOjective,
  approveAndSaveNLPOobjective 
} from '../../lib/nlp-objective-saver';
```

---

### **2. Modificar verificação de objetivos**

**Antigo:**
```javascript
// Verifica se deve salvar objetivo
const objectiveCheck = await checkAndSaveObjective(
  pool, 
  sessionId, 
  message,
  history
);

if (objectiveCheck.shouldSave && objectiveCheck.saved) {
  assistantMessage = objectiveCheck.message;
}
```

**Novo:**
```javascript
// Verifica se detectou objetivo NLP completo
const nlpCheck = await checkAndApproveNLPOjective(
  pool, 
  sessionId, 
  message,
  history
);

if (nlpCheck.shouldSave && nlpCheck.needsApproval) {
  // Retornar mensagem pedindo aprovação
  return NextResponse.json({ 
    message: nlpCheck.message,
    pendingApproval: true
  });
}
```

---

### **3. Adicionar verificação de aprovação**

**Adicionar após receber mensagem do usuário:**

```javascript
// Verificar se há objetivo pendente de aprovação
const pendingKey = `${sessionId}_pending`;

// Se usuário está respondendo sobre objetivo pendente
if (pendingObjectives.has(pendingKey)) {
  const pendingData = pendingObjectives.get(pendingKey);
  
  // Usuário aprovou?
  if (isApprovalMessage(message)) {
    const result = await approveAndSaveNLPOobjective(
      pool,
      sessionId,
      pendingData.objective,
      pendingData.memory
    );
    
    // Remover objetivo pendente
    pendingObjectives.delete(pendingKey);
    
    return NextResponse.json({ message: result.message });
  }
  
  // Usuário rejeitou?
  if (isRejectionMessage(message)) {
    pendingObjectives.delete(pendingKey);
    
    const cancelMessage = `Tudo bem! Não salvei o objetivo "${pendingData.objective.title}".`;
    
    return NextResponse.json({ message: cancelMessage });
  }
  
  // Se não for aprovação/rejeição, remover pendente
  pendingObjectives.delete(pendingKey);
}
```

---

## 📝 **CÓDIGO COMPLETO:**

### **app/api/chat/route.js - Versão com NLP Approval**

```javascript
import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '../../lib/db';
import { checkMessagePolicy } from '../../lib/guardrails';
import { 
  checkAndApproveNLPOobjective,
  approveAndSaveNLPOobjective 
} from '../../lib/nlp-objective-saver';

// Armazena objetivos pendentes de aprovação
const pendingObjectives = new Map();

function getUserFromToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

function isApprovalMessage(message) {
  const lower = message.toLowerCase().trim();
  const approvalPatterns = [
    /^sim$/i, /^só isso$/i, /^salvar$/i,
    /^confirmar$/i, /^salvar sim$/i
  ];
  return approvalPatterns.some(pattern => pattern.test(lower));
}

function isRejectionMessage(message) {
  const lower = message.toLowerCase().trim();
  const rejectionPatterns = [
    /^não$/i, /^no$/i, /^cancelar$/i,
    /^não salvar$/i, /^nãoo$/i, /^desiste$/i
  ];
  return rejectionPatterns.some(pattern => pattern.test(lower));
}

export async function POST(request) {
  const user = getUserFromToken(request);
  
  if (!user || !user.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = user.userId;

  try {
    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

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

    // VERIFICAR APROVAÇÃO DE OBJETIVO PENDENTE
    const pendingKey = `${sessionId}_pending`;

    if (pendingObjectives.has(pendingKey)) {
      const pendingData = pendingObjectives.get(pendingKey);

      if (isApprovalMessage(message)) {
        // Aprovar e salvar
        const result = await approveAndSaveNLPOobjective(
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

      if (isRejectionMessage(message)) {
        // Rejeitar
        pendingObjectives.delete(pendingKey);

        const cancelMessage = `Tudo bem! Não salvei o objetivo "${pendingData.objective.title}". Se quiser, podemos conversar mais sobre ele.`;

        await pool.query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
          [sessionId, 'assistant', cancelMessage]
        );

        return NextResponse.json({ message: cancelMessage });
      }

      // Não é aprovação/rejeição, remover pendente
      pendingObjectives.delete(pendingKey);
    }

    // Buscar histórico
    const historyResult = await pool.query(
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
      [sessionId]
    );

    const history = historyResult.rows.reverse();

    // VERIFICAR SE DETECTOU OBJETIVO NLP
    const nlpCheck = await checkAndApproveNLPObjective(
      pool, 
      sessionId, 
      message,
      history
    );

    if (nlpCheck.shouldSave && nlpCheck.needsApproval) {
      // Armazenar objetivo pendente
      pendingObjectives.set(pendingKey, {
        objective: nlpCheck.objective,
        memory: nlpCheck.memory
      });

      await pool.query(
        'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
        [sessionId, 'assistant', nlpCheck.message]
      );

      return NextResponse.json({
        message: nlpCheck.message,
        pendingApproval: true
      });
    }

    // Processar mensagem normalmente
    const assistantMessage = await processMessage(message, history, pool);

    await pool.query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3)',
      [sessionId, 'assistant', assistantMessage]
    );

    return NextResponse.json({ message: assistantMessage });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}

async function processMessage(message, history, pool) {
  // Sua lógica de processamento de mensagem aqui
  return `Recebi sua mensagem: "${message}"`;
}
```

---

## 🎯 **EXEMPLO DE FLUXO:**

### **Mensagem 1: Usuário descreve objetivo**
```
"Quero aprender inglês fluentemente em 6 meses. 
Vou estudar 1h por dia em casa usando aplicativos..."
```

**Resposta 1: Coach mostra objetivo e pede aprovação**
```
🎯 **Objetivo NLP Completo Detectado!**

Detectei que você descreveu um objetivo com todos os 
critérios NLP. Aqui está o resumo:

...

**Deseja salvar este objetivo e sua memória?**

Responda:
- **"SIM"** para salvar
- **"NÃO"** para cancelar
- **"EDITAR"** para modificar algo
```

### **Mensagem 2: Usuário aprova**
```
"SIM"
```

**Resposta 2: Objetivo salvo**
```
✅ **Objetivo NLP salvo com sucesso!**

"Aprender inglês fluentemente"

Agora você pode ver seus objetivos na aba "Objectives".

Quer que eu crie uma quest automática a partir dele?
```

---

## 🚀 **DEPLOY:**

1. ✅ Copiar `nlp-objective-saver.js` para `app/lib/`
2. ✅ Atualizar imports em `app/api/chat/route.js`
3. ✅ Adicionar verificação de aprovação
4. ✅ Testar fluxo completo
5. ✅ Fazer deploy

---

**Próximo passo:** Implementar integração completa! 🚀
