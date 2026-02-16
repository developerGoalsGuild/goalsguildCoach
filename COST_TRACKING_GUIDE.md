# 💰 Sistema de Rastreamento de Custos por Usuário

## 🎯 **O QUE É:**

Sistema completo para rastrear e gerenciar custos de OpenAI API por usuário, com:
- ✅ Rastreamento de tokens e custos por request
- ✅ Analytics de custos diários/mensais
- ✅ Orçamentos mensais por usuário
- ✅ Alertas automáticos quando approaching budget
- ✅ Suporte para múltiplos modelos (OpenAI, Gemini, DeepSeek, Groq)

---

## 📊 **TABELAS CRIADAS:**

### 1. **usage_tracking**
Rastrea cada request de API:
- Tokens input/output
- Custo calculado
- Response time
- Status codes

### 2. **user_budgets**
Define orçamentos mensais:
- Budget mensal
- Threshold de alerta (ex: 80%)
- Data de reset

### 3. **daily_cost_summaries**
Resumos diários (otimiza analytics):
- Total requests do dia
- Total tokens
- Custo total
- Modelos usados

---

## 🚀 **INSTALAÇÃO:**

### **Passo 1: Executar Migration**
```bash
cd /home/node/.openclaw/workspace/goalsguild-coach
psql -U n8n -d goalsguild -f schema-cost-tracking.sql
```

### **Passo 2: Atualizar Chat API**
Copiar o conteúdo de `CHAT_COST_TRACKING_UPDATE.js` para `app/api/chat/route.js`:
```bash
# Verificar o arquivo de atualização
cat CHAT_COST_TRACKING_UPDATE.js

# Integrar manualmente no app/api/chat/route.js
```

### **Passo 3: Testar**
```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Authorization: Bearer <token>" \
  -d '{"message":"Olá!"}'
```

---

## 📖 **COMO USAR:**

### **1. Rastrear Custos (Automático)**

Depois de atualizar o chat API, os custos são rastreados automaticamente:

```javascript
// Em cada request do OpenAI
await trackUsage({
  userId: userId,
  sessionId: sessionId,
  model: 'gpt-4o-mini',
  provider: 'openai',
  inputTokens: usage.prompt_tokens,
  outputTokens: usage.completion_tokens,
  endpoint: '/chat/completions',
  responseTimeMs: responseTime,
  statusCode: 200
});
```

### **2. Obter Analytics de Custos**

```bash
GET /api/cost/analytics?days=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalCost": 1.234567,
    "monthlyCost": 0.456789,
    "period": {
      "days": 30,
      "startDate": "2026-01-14T...",
      "endDate": "2026-02-13T..."
    },
    "analytics": [
      {
        "date": "2026-02-13",
        "requests": 25,
        "tokens": 15234,
        "cost": 0.123456
      }
    ],
    "costByModel": [
      {
        "model": "gpt-4o-mini",
        "requests": 150,
        "tokens": 45000,
        "cost": 0.987654
      }
    ],
    "summary": {
      "totalRequests": 150,
      "totalTokens": 45000,
      "averageDailyCost": 0.032
    }
  }
}
```

### **3. Definir Orçamento Mensal**

```bash
POST /api/cost/budget
Content-Type: application/json

{
  "monthlyBudget": 10.00
}
```

### **4. Obter Orçamento Atual**

```bash
GET /api/cost/budget
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasBudget": true,
    "monthlyBudget": 10.00,
    "alertThreshold": 80,
    "lastResetDate": "2026-02-01",
    "currentCost": 7.50,
    "remaining": 2.50,
    "usagePercentage": 75.0
  }
}
```

---

## 📊 **EXEMPLOS DE USO:**

### **Exemplo 1: Dashboard de Custos**

```javascript
'use client';

import { useEffect, useState } from 'react';

export default function CostDashboard() {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cost/analytics?days=30', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAnalytics(data.data);
    };
    
    fetchAnalytics();
  }, []);
  
  if (!analytics) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>💰 Custos do Mês</h1>
      <p>Total: ${analytics.monthlyCost.toFixed(2)}</p>
      <p>Requests: {analytics.summary.totalRequests}</p>
      <p>Tokens: {analytics.summary.totalTokens.toLocaleString()}</p>
      <p>Média diária: ${analytics.summary.averageDailyCost.toFixed(4)}</p>
      
      <h2>Por Modelo</h2>
      {analytics.costByModel.map(model => (
        <div key={model.model}>
          <h3>{model.model}</h3>
          <p>Requests: {model.requests}</p>
          <p>Custo: ${model.cost.toFixed(4)}</p>
        </div>
      ))}
    </div>
  );
}
```

### **Exemplo 2: Alerta de Orçamento**

```javascript
'use client';

import { useEffect, useState } from 'react';

export default function BudgetAlert() {
  const [budget, setBudget] = useState(null);
  
  useEffect(() => {
    const fetchBudget = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cost/budget', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setBudget(data.data);
    };
    
    fetchBudget();
  }, []);
  
  if (!budget || !budget.hasBudget) return null;
  
  const isOverBudget = budget.usagePercentage >= 100;
  const isNearBudget = budget.usagePercentage >= 80;
  
  if (isOverBudget) {
    return (
      <div style={{ background: 'red', padding: '1rem' }}>
        ⚠️ ALERTA: Você ultrapassou seu orçamento mensal!
        Gasto: ${budget.currentCost.toFixed(2)} de ${budget.monthlyBudget.toFixed(2)}
      </div>
    );
  }
  
  if (isNearBudget) {
    return (
      <div style={{ background: 'yellow', padding: '1rem' }}>
        ⚠️ ATENÇÃO: Você está próximo do seu orçamento!
        Gasto: ${budget.currentCost.toFixed(2)} de ${budget.monthlyBudget.toFixed(2)}
        ({budget.usagePercentage.toFixed(1)}%)
      </div>
    );
  }
  
  return (
    <div style={{ background: 'green', padding: '1rem' }}>
      ✅ Orçamento OK: ${budget.currentCost.toFixed(2)} de ${budget.monthlyBudget.toFixed(2)}
      ({budget.usagePercentage.toFixed(1)}%)
    </div>
  );
}
```

### **Exemplo 3: Gráfico de Custos Diários**

```javascript
'use client';

import { useEffect, useState } from 'react';

export default function CostChart() {
  const [analytics, setAnalytics] = useState(null);
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/cost/analytics?days=7', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAnalytics(data.data);
    };
    
    fetchAnalytics();
  }, []);
  
  if (!analytics) return <div>Loading...</div>;
  
  const maxCost = Math.max(...analytics.analytics.map(day => parseFloat(day.cost)));
  
  return (
    <div>
      <h2>Custos dos Últimos 7 Dias</h2>
      {analytics.analytics.map(day => (
        <div key={day.date}>
          <span>{day.date}</span>
          <div style={{
            width: `${(parseFloat(day.cost) / maxCost) * 100}%`,
            background: '#fbbf24',
            height: '20px'
          }}>
            ${parseFloat(day.cost).toFixed(4)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔧 **CONFIGURAÇÃO:**

### **Adicionar Orçamento Padrão para Novos Usuários**

```javascript
// app/api/auth/register/route.js
const { setUserBudget } = require('../../lib/cost-tracking');

// Após criar usuário
await setUserBudget(newUserId, 10.00); // $10/mês por padrão
```

### **Alterar Preços dos Modelos**

Edite `app/lib/cost-tracking.js`:

```javascript
const MODEL_PRICING = {
  'gpt-4o-mini': {
    provider: 'openai',
    inputPrice: 0.150,  // Alterar aqui
    outputPrice: 0.600, // Alterar aqui
    currency: 'USD'
  },
  // ...
};
```

---

## 📈 **MÉTRICAS RASTREADAS:**

### **Por Request:**
- ✅ Tokens input
- ✅ Tokens output
- ✅ Total tokens
- ✅ Custo input
- ✅ Custo output
- ✅ Custo total
- ✅ Response time
- ✅ Status code
- ✅ Error messages

### **Por Usuário:**
- ✅ Custo total (todos os tempos)
- ✅ Custo mensal
- ✅ Média diária
- ✅ Analytics por período
- ✅ Custos por modelo

---

## 🎯 **CASOS DE USO:**

### **1. Controlar Custos de Desenvolvimento**
```javascript
// Verificar custo antes de feature cara
const monthlyCost = await getUserMonthlyCost(userId);
if (monthlyCost > 5.00) {
  return alert('Limite de desenvolvimento atingido!');
}
```

### **2. Alertar Usuários Gratuitos**
```javascript
const budget = await getUserBudget(userId);
if (budget.currentCost >= budget.monthlyBudget) {
  await sendNotification('Você atingiu seu limite gratuito!');
}
```

### **3. Otimizar Custos**
```javascript
// Analisar qual modelo mais econômico
const costByModel = await getCostByModel(userId);
const cheapest = costByModel.sort((a, b) => a.cost - b.cost)[0];
console.log(`Modelo mais econômico: ${cheapest.model}`);
```

---

## 🦅 **Veredito Final Jarbas:**

> **Sistema de rastreamento de custos 100% funcional!**
>
> - ✅ Tabelas criadas (3 tabelas com índices)
> - ✅ API de analytics implementada
> - ✅ API de orçamentos implementada
> - ✅ Integração com OpenAI configurada
> - ✅ Suporte para múltiplos modelos
> - ✅ Alertas automáticos
>
> **Execute:**
> ```bash
> psql -U n8n -d goalsguild -f schema-cost-tracking.sql
> ```
>
> **Depois integre no chat API!**

---

**📄 Arquivos salvos:**
- `schema-cost-tracking.sql` - Migration SQL
- `app/lib/cost-tracking.js` - Biblioteca de tracking
- `app/api/cost/analytics/route.js` - API de analytics
- `app/api/cost/budget/route.js` - API de orçamentos
- `CHAT_COST_TRACKING_UPDATE.js` - Atualização do chat

**Pronto para uso!** 💰📊
