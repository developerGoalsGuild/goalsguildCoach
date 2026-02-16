# 📚 Documentação de APIs - GoalsGuild Coach

## Visão Geral

Todas as APIs seguem o padrão RESTful, retornam JSON e usam autenticação via cookies.

**Autenticação:**
```javascript
// Session cookie é verificado automaticamente
// Se inválido → 401 Unauthorized
```

**Respostas de Erro:**
```javascript
// 400 Bad Request
{ "error": "Invalid input" }

// 401 Unauthorized
{ "error": "Unauthorized" }

// 403 Forbidden
{ "error": "Forbidden" }

// 404 Not Found
{ "error": "Resource not found" }

// 500 Internal Server Error
{ "error": "Something went wrong" }
```

---

## 1. Tasks API

### GET /api/tasks

**Descrição:** Lista todas as tasks do usuário

**Query Params:**
- `status` (opcional): Filter por status (`pending`, `completed`)

**Response:**
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Implementar testes",
      "description": "Criar testes unitários",
      "status": "pending",
      "priority": "high",
      "estimated_hours": 4,
      "quest_id": null,
      "quest_title": null,
      "created_at": "2026-02-12T10:00:00.000Z",
      "completed_at": null
    }
  ]
}
```

**Exemplo:**
```bash
curl http://localhost:3002/api/tasks
curl http://localhost:3002/api/tasks?status=pending
```

### POST /api/tasks

**Descrição:** Cria nova task

**Request:**
```json
{
  "title": "Implementar testes",
  "description": "Criar testes unitários",
  "priority": "high",
  "estimated_hours": 4,
  "quest_id": null
}
```

**Response:**
```json
{
  "task": {
    "id": 1,
    "title": "Implementar testes",
    ...
  }
}
```

**Validação:**
- `title` (obrigatório): string, max 500 chars
- `priority` (opcional): `low`, `medium`, `high`
- `estimated_hours` (opcional): número
- `quest_id` (opcional): ID da quest

### PUT /api/tasks/[id]

**Descrição:** Atualiza task

**Request:**
```json
{
  "title": "Novo título",
  "status": "completed"
}
```

### DELETE /api/tasks/[id]

**Descrição:** Deleta task

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## 2. Quests API

### GET /api/quests

**Descrição:** Lista todas as quests do usuário

**Query Params:**
- `status` (opcional): `in_progress`, `completed`, `archived`

**Response:**
```json
{
  "quests": [
    {
      "id": 1,
      "title": "Master Testing",
      "description": "Aprender testes unitários",
      "difficulty": "medium",
      "current_xp": 150,
      "estimated_xp": 300,
      "status": "in_progress",
      "progress": 50,
      "milestones": [
        {
          "id": 1,
          "title": "Estudar Jest",
          "status": "completed"
        },
        {
          "id": 2,
          "title": "Criar testes",
          "status": "pending"
        }
      ],
      "created_at": "2026-02-10T10:00:00.000Z",
      "completed_at": null
    }
  ]
}
```

### POST /api/quests

**Descrição:** Cria nova quest com milestones automáticos

**Request:**
```json
{
  "title": "Master Testing",
  "description": "Aprender testes unitários",
  "difficulty": "medium",
  "objective_id": 1
}
```

**Dificuldades e XP:**
- `easy`: 50-100 XP (2-3 milestones)
- `medium`: 150-300 XP (3-4 milestones)
- `hard`: 400-600 XP (4-5 milestones)
- `epic`: 700-800 XP (5 milestones)

**Response:**
```json
{
  "quest": {
    "id": 1,
    "title": "Master Testing",
    ...
  },
  "milestones": [
    { "id": 1, "title": "Milestone 1", ... },
    { "id": 2, "title": "Milestone 2", ... }
  ]
}
```

### POST /api/quests/from-objective

**Descrição:** Converte objetivo em quest automaticamente

**Request:**
```json
{
  "objective_id": 1,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "quest": {
    "id": 1,
    "title": "Correr 5km, 3x/semana",
    "difficulty": "medium",
    ...
  },
  "milestones": [...]
}
```

---

## 3. Objectives API

### GET /api/objectives

**Descrição:** Lista todos os objetivos do usuário

**Query Params:**
- `status` (opcional): `in_progress`, `completed`, `archived`
- `category` (opcional): `health`, `learning`, `career`, etc.

**Response:**
```json
{
  "objectives": [
    {
      "id": 1,
      "statement": "Correr 5km, 3x/semana",
      "category": "health",
      "status": "in_progress",
      "progress": 60,
      "quests_created": 1,
      "quests_completed": 0,
      "created_at": "2026-02-10T10:00:00.000Z"
    }
  ]
}
```

### POST /api/objectives

**Descrição:** Cria novo objetivo usando Coach AI

**Request:**
```json
{
  "statement": "Quero correr 5km, 3x por semana"
}
```

**Response:**
```json
{
  "objective": {
    "id": 1,
    "statement": "Correr 5km, 3x/semana",
    "category": "health",
    "status": "in_progress",
    "details": {
      "criteria_1": "Correr 5km por sessão",
      "criteria_2": "Melhorar condicionamento físico",
      "criteria_3": "3x por semana é realista",
      "criteria_4": "Em 3 meses",
      "evidence": "Conseguir correr sem parar",
      "alignment": "Saúde é prioridade",
      "resources": "Tênis, parque, hora livre",
      "ecology": "Não interfere no trabalho"
    }
  }
}
```

### GET /api/objectives/[id]

**Descrição:** Busca objetivo específico

**Response:**
```json
{
  "objective": {
    "id": 1,
    "statement": "Correr 5km, 3x/semana",
    "details": {...},
    "quests": [...],
    "checkins": [...]
  }
}
```

### PUT /api/objectives/[id]

**Descrição:** Atualiza objetivo

**Request:**
```json
{
  "statement": "Correr 7km, 3x/semana",
  "status": "completed"
}
```

### DELETE /api/objectives/[id]

**Descrição:** Deleta objetivo

---

## 4. Coach API

### POST /api/coach

**Descrição:** Envia mensagem para Coach AI

**Request:**
```json
{
  "message": "Me ajude a criar um objetivo de corrida"
}
```

**Response:**
```json
{
  "response": "Vou te ajudar! Qual é a sua meta específica de corrida?",
  "history": [
    { "role": "user", "content": "Me ajude a criar um objetivo" },
    { "role": "assistant", "content": "Vou te ajudar!" }
  ]
}
```

**Fluxo de Conversação:**
1. Usuário envia mensagem
2. Sistema salva no histórico
3. Coach AI gera resposta
4. Resposta salva no histórico
5. Retornada para usuário

---

## 5. Analytics API

### GET /api/analytics

**Descrição:** Retorna analytics de produtividade

**Query Params:**
- `period` (obrigatório): `week`, `month`

**Response:**
```json
{
  "stats": [
    {
      "date": "2026-02-10",
      "quests_completed": 2,
      "milestones_completed": 5,
      "xp_earned": 200,
      "tasks_completed": 10,
      "active_days": 1
    }
  ],
  "byDayOfWeek": [
    {
      "day_of_week": 1,
      "quests_completed": 5,
      "milestones_completed": 12,
      "xp_earned": 500
    }
  ],
  "activeHours": [
    {
      "date": "2026-02-10",
      "active_hours": 3
    }
  ],
  "objectiveProgress": [
    {
      "objective_id": 1,
      "statement": "Correr 5km",
      "progress": 60
    }
  ]
}
```

**Períodos:**
- `week`: Últimos 7 dias
- `month`: Últimos 30 dias

---

## 6. Reports API

### GET /api/reports?type=week

**Descrição:** Gera report semanal

**Response:**
```json
{
  "period": {
    "start": "2026-02-05T00:00:00.000Z",
    "end": "2026-02-12T00:00:00.000Z"
  },
  "stats": {
    "current": {
      "quests_completed": 5,
      "milestones_completed": 15,
      "xp_earned": 800,
      "active_days": 6,
      "longest_streak": 4
    },
    "previous": {
      "milestones_completed": 10,
      "xp_earned": 500
    }
  },
  "objectives": [
    {
      "id": 1,
      "statement": "Correr 5km",
      "quests_created": 1,
      "quests_completed": 0,
      "progress": 60
    }
  ],
  "quests": [
    {
      "id": 1,
      "title": "Quest 1",
      "difficulty": "medium",
      "status": "completed"
    }
  ],
  "checkins": [...],
  "textReport": "WEEKLY REPORT\n=============\n\nQuests completed: 5\nXP earned: 800\n..."
}
```

### GET /api/reports?type=month

**Descrição:** Gera report mensal

### POST /api/reports

**Descrição:** Exporta report como texto

**Request:**
```json
{
  "type": "week"
}
```

**Response:**
```json
{
  "textReport": "WEEKLY REPORT\n...",
  "generatedAt": "2026-02-12T10:00:00.000Z"
}
```

---

## 7. Achievements API

### GET /api/achievements

**Descrição:** Lista achievements e progresso

**Response:**
```json
{
  "achievements": [
    {
      "id": 1,
      "name": "First Quest",
      "category": "quests",
      "requirement_value": 1,
      "icon": "🎯",
      "description": "Complete sua primeira quest",
      "unlocked": true,
      "unlocked_at": "2026-02-10T10:00:00.000Z"
    }
  ],
  "grouped": {
    "quests": [...],
    "xp": [...],
    "streak": [...],
    "objectives": [...]
  },
  "stats": {
    "total_quests": 5,
    "total_xp": 800,
    "longest_streak": 3,
    "total_objectives": 2
  },
  "user": {
    "level": 2,
    "current_xp": 800,
    "xp_to_next_level": 1000,
    "progress": 80
  }
}
```

### POST /api/achievements

**Descrição:** Verifica e desbloqueia achievements

**Response:**
```json
{
  "success": true,
  "newlyUnlocked": [
    {
      "id": 1,
      "name": "First Quest",
      "icon": "🎯"
    }
  ],
  "totalUnlocked": 5
}
```

---

## 8. Insights API

### GET /api/insights

**Descrição:** Gera insights automáticos com IA

**Response:**
```json
{
  "insights": [
    {
      "type": "most_productive_day",
      "title": "Dia Mais Produtivo: Segunda",
      "description": "Você completa 5 milestones em Segunda (média: 2.0).",
      "impact": "high",
      "recommendation": "Tente agendar tarefas importantes para Segunda."
    },
    {
      "type": "best_hour",
      "title": "Melhor Horário: 10:00",
      "description": "Você ganha mais XP às 10h (média: 100 XP/h).",
      "impact": "medium",
      "recommendation": "Reserve esse horário para tarefas difíceis."
    },
    {
      "type": "checkin_correlation",
      "title": "Check-in x Produtividade",
      "description": "Dias com check-in têm 2x mais milestones completados.",
      "impact": "high",
      "recommendation": "Mantenha o hábito de check-in diário."
    }
  ],
  "predictions": [
    {
      "objective": "Correr 5km, 3x/semana",
      "prediction": {
        "totalMilestones": 10,
        "avgMilestonesPerDay": "2.50",
        "daysToCompletion": 4,
        "completionDate": "2026-02-16T10:00:00.000Z",
        "confidence": "medium"
      }
    }
  ],
  "generatedAt": "2026-02-12T10:00:00.000Z"
}
```

### POST /api/insights

**Descrição:** Gera insights + formata como texto

**Response:**
```json
{
  "insights": [...],
  "predictions": [...],
  "textInsights": "🤖 INSIGHTS AUTOMÁTICOS\n\nDia Mais Produtivo: Segunda..."
}
```

---

## 9. Weekly Review API

### GET /api/weekly-review

**Descrição:** Gera weekly review automático

**Response:**
```json
{
  "period": {
    "start": "2026-02-05T00:00:00.000Z",
    "end": "2026-02-12T00:00:00.000Z"
  },
  "stats": {
    "current": {
      "quests_completed": 3,
      "milestones_completed": 9,
      "xp_earned": 600,
      "active_days": 5,
      "longest_streak": 3
    },
    "previous": {
      "milestones_completed": 8,
      "xp_earned": 500
    }
  },
  "objectives": [...],
  "checkins": [...],
  "questions": [
    {
      "id": "learned",
      "text": "O que você aprendeu esta semana?"
    }
  ],
  "reviewText": "WEEKLY REVIEW\n==============\n\nO que você aprendeu?\n...",
  "generatedAt": "2026-02-12T10:00:00.000Z"
}
```

### POST /api/weekly-review

**Descrição:** Salva respostas do weekly review

**Request:**
```json
{
  "weekStart": "2026-02-05T00:00:00.000Z",
  "answers": {
    "learned": "Aprendi a ser mais produtivo",
    "victory": "Completei 3 quests",
    "challenges": "Dificuldade com tempo",
    "improve": "Organizar melhor",
    "goals": "Terminar projeto X",
    "next_week": "Focar em testes"
  }
}
```

**Response:**
```json
{
  "success": true,
  "reviewId": 1,
  "message": "Weekly review salva!"
}
```

---

## 10. Notifications API

### GET /api/notifications

**Descrição:** Lista notificações do usuário

**Query Params:**
- `unread_only` (opcional): `true` para apenas não lidas

**Response:**
```json
{
  "notifications": [
    {
      "id": 1,
      "type": "daily_checkin",
      "title": "Check-in Diário",
      "message": "Não esqueça de fazer seu check-in!",
      "read": false,
      "created_at": "2026-02-12T09:00:00.000Z"
    }
  ]
}
```

### POST /api/notifications

**Descrição:** Cria notificação personalizada

**Request:**
```json
{
  "type": "custom",
  "title": "Lembrete",
  "message": "Não esqueça de completar sua quest!"
}
```

### PUT /api/notifications/[id]

**Descrição:** Marca notificação como lida

**Request:**
```json
{
  "read": true
}
```

---

## Códigos de Status

| Código | Significado |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Rate Limiting

Atualmente: **Sem rate limiting** (desenvolvimento)

Produção: **Sugerido 100 req/minuto**

---

## Webhooks (Futuro)

Planejado para:
- Integração com Google Calendar
- Integração com Notion
- Social features

---

**Fim da Documentação de APIs** 📚
