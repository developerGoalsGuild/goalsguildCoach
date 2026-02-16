# GoalsGuild Coach - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Features Implementadas](#features-implementadas)
5. [Banco de Dados](#banco-de-dados)
6. [APIs](#apis)
7. [Frontend](#frontend)
8. [Testes](#testes)
9. [Configuração](#configuração)
10. [Como Rodar](#como-rodar)
11. [Deploy](#deploy)
12. [Estrutura de Arquivos](#estrutura-de-arquivos)
13. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
14. [Roadmap](#roadmap)

---

## Visão Geral

### O que é GoalsGuild Coach?

Um sistema completo de produtividade e gamificação que combina:
- **Objectives NLP**: Objetivos bem-formados usando linguagem natural
- **Quest System**: Gamificação com quests, milestones e XP
- **Tasks Management**: Gerenciamento de tarefas diárias
- **Coach AI**: Assistente pessoal com IA (requer OpenAI API key)
- **Analytics Dashboard**: Métricas e insights de produtividade
- **Daily Check-ins**: Reflexões diárias com mood tracking
- **Reports**: Relatórios semanais e mensais
- **Achievements**: Sistema de conquistas e badgers
- **Pomodoro Timer**: Timer para técnica Pomodoro
- **Notifications**: Sistema de notificações push

### Proposta de Valor

**"Transforme seus objetivos em realidade com gamificação, IA e insights de produtividade"**

**Diferenciais:**
- 🤖 Coach AI conversacional
- 🎯 Objetivos NLP bem-formados
- ⚔️ Sistema gamificado completo
- 📊 Analytics profundos
- 🏆 17 achievements para desbloquear
- 📝 Check-ins diários
- 💡 Insights automáticos com IA

---

## Arquitetura

### Arquitetura Geral

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (Next.js)                   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │ Home   │  │ Coach  │  │Quests  │  │ Tasks  │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │Object  │  │Daily   │  │Analyt  │  │Achiev  │   │
│  └────────┘  └────────┘  └────────┘  └────────┘   │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓ REST API
┌─────────────────────────────────────────────────────────┐
│              BACKEND (Next.js API Routes)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  Tasks   │  │  Quests  │  │  Coach   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Analytics │  │ Reports  │  │ Insights  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│              LAYER DE SERVIÇOS                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Auth-Help │  │OpenAI    │  │Insights  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │Weekly-Rev│  │Notify    │  │Achieve   │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────┐
│              DATABASE (PostgreSQL)                       │
│  ┌───────────────────────────────────────────┐        │
│  │ 16 Tabelas: users, sessions, quests,       │        │
│  │ tasks, milestones, nlp_objectives,         │        │
│  │ achievements, notifications, etc.          │        │
│  └───────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

### Padrões Arquiteturais

**API Routes (Next.js 15):**
- RESTful APIs em `/app/api/`
- Handlers: GET, POST, PUT, DELETE
- Autenticação via cookies
- Respostas JSON

**Bibliotecas:**
- `lib/auth-helpers.js`: Autenticação e sessões
- `lib/openai.js`: Integração OpenAI GPT-4o-mini
- `lib/db.js`: Pool PostgreSQL
- `lib/insights.js`: Análise de produtividade
- `lib/notifications.js`: Sistema de notificações
- `lib/weekly-review.js`: Reviews semanais

**Componentes:**
- Reusable components em `/app/components/`
- Context para estado global
- Custom hooks para lógica

---

## Stack Tecnológico

### Frontend
- **Framework:** Next.js 15 (App Router)
- **React:** React 19
- **Estilização:** CSS Modules + Tailwind-style utilities
- **Ícones:** Emoji-based
- **UI Patterns:** Dark theme consistente

### Backend
- **Runtime:** Node.js (Next.js API Routes)
- **Banco:** PostgreSQL 15+
- **ORM:** SQL nativo com `pg`
- **IA:** OpenAI GPT-4o-mini (opcional)

### DevOps
- **Testes:** Jest + React Testing Library
- **Controle de Versão:** Git
- **Package Manager:** npm

### Configuração
- **Porta:** 3002 (desenvolvimento)
- **Environment:** `.env.local`
- **Node:** v22+

---

## Features Implementadas

### 1. 🤖 Coach AI

**Descrição:** Assistente pessoal conversacional com IA

**Funcionalidades:**
- Chat em linguagem natural
- Criação de objetivos bem-formados
- Resolução de fricções ecológicas
- Histórico de conversas
- Sugestões de prompts

**Endpoint:** `/api/coach`
**Métodos:** POST

**Requisitos:** OpenAI API key

### 2. 🎯 Objectives NLP

**Descrição:** Objetivos bem-formados usando NLP

**Funcionalidades:**
- Criação de objetivos com 8 critérios
- Conversão automática em quests
- Análise de viabilidade
- Resolução de fricções
- Memory de objetivos

**Endpoint:** `/api/objectives`
**Métodos:** GET, POST, PUT, DELETE

**Critérios:**
1. Específico e mensurável
2. Atrativo e motivador
3. Realista e alcançável
4. Tempo-bound (data final)
5. Evidence-based (evidência de sucesso)
6. Alinhado com valores
7. Resources (recursos necessários)
8. Ecologia (impacto na vida)

### 3. ⚔️ Quest System

**Descrição:** Sistema de quests gamificado

**Funcionalidades:**
- Criação de quests (easy/medium/hard/epic)
- 3-5 milestones automáticos
- XP baseado em dificuldade (50-800)
- Progress tracking
- Conversão de objetivos em quests

**Endpoints:**
- `/api/quests` - CRUD de quests
- `/api/quests/from-objective` - Converter objetivo em quest

**Dificuldades:**
- Easy: 50-100 XP
- Medium: 150-300 XP
- Hard: 400-600 XP
- Epic: 700-800 XP

### 4. ✅ Tasks Management

**Descrição:** Gerenciamento de tarefas diárias

**Funcionalidades:**
- CRUD completo de tarefas
- Prioridades (high/medium/low)
- Associação com quests
- Horas estimadas
- Status (pending/completed)
- Ordenação automática
- Quick add

**Endpoint:** `/api/tasks`
**Métodos:** GET, POST, PUT, DELETE

### 5. 📊 Analytics Dashboard

**Descrição:** Dashboard de métricas de produtividade

**Funcionalidades:**
- Stats por período (semana/mês)
- Gráficos por dia da semana
- Tendência de tarefas (30 dias)
- Distribuição por status
- Progresso de objetivos

**Endpoint:** `/api/analytics`
**Métodos:** GET

**Visualizações:**
- Barras por dia
- Heatmap de atividade
- Linhas de tendência
- Gráficos circulares

### 6. 📄 Reports

**Descrição:** Relatórios semanais e mensais

**Funcionalidades:**
- Relatório semanal
- Relatório mensal
- Exportação em texto
- Comparação com período anterior
- Estatísticas agregadas

**Endpoint:** `/api/reports`
**Métodos:** GET, POST

**Formato:**
- ASCII art
- Texto formatado
- Estatísticas visuais

### 7. 🏆 Achievements

**Descrição:** Sistema de conquistas e badgers

**Funcionalidades:**
- 17 achievements em 4 categorias
- Auto-unlock
- Toast notifications
- Progress tracking
- Categorias: Quests, XP, Streak, Objectives

**Endpoint:** `/api/achievements`
**Métodos:** GET, POST

**Categorias:**
- **Quests (5):** First Quest, Quest Master, etc.
- **XP (5):** XP Beginner, XP Champion, etc.
- **Streak (4):** 3-Day Streak, 7-Day Streak, etc.
- **Objectives (3):** First Objective, Objective Master, etc.

### 8. 📝 Daily Check-ins

**Descrição:** Reflexões diárias com mood tracking

**Funcionalidades:**
- Mood selection (emoji-based)
- Gratitude journaling
- Highlights do dia
- Challenges enfrentados
- Metas para amanhã
- Resumo automático às 23h
- Memory de check-ins

**Endpoint:** `/api/daily-checkin`
**Métodos:** GET, POST

**Campos:**
- Mood (good/okay/bad)
- Gratidão (texto)
- Highlights (texto)
- Challenges (texto)
- Tomorrow goals (texto)

### 9. 💡 Insights

**Descrição:** Insights automáticos com IA

**Funcionalidades:**
- Dia mais produtivo
- Melhor horário de trabalho
- Correlação check-in x produtividade
- Previsão de conclusão de objetivos
- Padrões de comportamento

**Endpoint:** `/api/insights`
**Métodos:** GET, POST

**Tipos de Insights:**
- Productivity patterns
- Best hours
- Check-in correlations
- Completion predictions

### 10. ⏱️ Pomodoro Timer

**Descrição:** Timer para técnica Pomodoro

**Funcionalidades:**
- Timer 25/5/15 minutos
- Troca automática de modos
- Pausa longa após 4 pomodoros
- Notificações nativas
- Sessões salvas no banco
- Contador de pomodoros

**Modos:**
- Foco: 25 min
- Pausa curta: 5 min
- Pausa longa: 15 min

### 11. 🔔 Notifications

**Descrição:** Sistema de notificações push

**Funcionalidades:**
- Notificações diárias (9h, 21h)
- Weekly review (domingo 10h)
- Alertas de objetivos em risco
- Celebrações de achievements
- Preferências customizáveis

**Endpoint:** `/api/notifications`
**Métodos:** GET, POST, PUT, DELETE

**Tipos:**
- daily_checkin
- weekly_review
- objectives_at_risk
- achievement_unlocked

### 12. 📅 Weekly Review

**Descrição:** Review semanal automatizado

**Funcionalidades:**
- Geração automática (domingo 10h)
- 6 perguntas reflexivas
- Comparação com semana anterior
- Stats e progresso
- Respostas salvas

**Endpoint:** `/api/weekly-review`
**Métodos:** GET, POST

**Perguntas:**
1. O que você aprendeu?
2. Qual foi sua maior vitória?
3. Quais foram os desafios?
4. O que você faria diferente?
5. O que melhorar?
6. Quais são seus objetivos?

---

## Banco de Dados

### Schema Completo (16 Tabelas)

#### Autenticação & Usuários
```sql
-- users: Usuários do sistema
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255),
  level INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,
  xp_to_next_level INTEGER DEFAULT 100
);

-- sessions: Sessões de autenticação
CREATE TABLE sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

#### Sistema de Quests
```sql
-- quests: Quests do usuário
CREATE TABLE quests (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  title VARCHAR(500),
  description TEXT,
  difficulty VARCHAR(20),
  current_xp INTEGER DEFAULT 0,
  estimated_xp INTEGER,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- milestones: Milestones das quests
CREATE TABLE milestones (
  id SERIAL PRIMARY KEY,
  quest_id INTEGER REFERENCES quests(id),
  title VARCHAR(500),
  description TEXT,
  status VARCHAR(20),
  completed_at TIMESTAMP
);

-- quest_journal: Histórico de progresso
CREATE TABLE quest_journal (
  id SERIAL PRIMARY KEY,
  quest_id INTEGER REFERENCES quests(id),
  event_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Sistema de Tasks
```sql
-- tasks: Tarefas do usuário
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  quest_id INTEGER REFERENCES quests(id),
  title VARCHAR(500),
  description TEXT,
  priority VARCHAR(20),
  status VARCHAR(20),
  estimated_hours DECIMAL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

#### Objetivos NLP
```sql
-- nlp_objectives: Objetivos bem-formados
CREATE TABLE nlp_objectives (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  statement TEXT,
  category VARCHAR(50),
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- nlp_objective_details: Detalhes dos objetivos
CREATE TABLE nlp_objective_details (
  id SERIAL PRIMARY KEY,
  objective_id INTEGER REFERENCES nlp_objectives(id),
  criteria_1 TEXT, -- Específico
  criteria_2 TEXT, -- Atrativo
  criteria_3 TEXT, -- Realista
  criteria_4 TEXT, -- Tempo-bound
  evidence TEXT,
  alignment TEXT,
  resources TEXT,
  ecology TEXT
);
```

#### Gamificação
```sql
-- achievements: Badges disponíveis
CREATE TABLE achievements (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  category VARCHAR(50),
  requirement_value INTEGER,
  icon VARCHAR(50),
  description TEXT
);

-- user_achievements: Achievements desbloqueados
CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  achievement_id INTEGER REFERENCES achievements(id),
  unlocked_at TIMESTAMP DEFAULT NOW()
);

-- streaks: Sequências de dias
CREATE TABLE streaks (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  start_date DATE,
  end_date DATE,
  length INTEGER
);
```

#### Check-ins Diários
```sql
-- daily_checkins: Check-ins do usuário
CREATE TABLE daily_checkins (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  date DATE,
  mood VARCHAR(20),
  gratitude TEXT,
  highlights TEXT,
  challenges TEXT,
  tomorrow_goals TEXT
);
```

#### Lembretes
```sql
-- objective_reminders: Lembretes de objetivos
CREATE TABLE objective_reminders (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  objective_id INTEGER REFERENCES nlp_objectives(id),
  frequency VARCHAR(20),
  time TIME,
  active BOOLEAN DEFAULT TRUE
);
```

#### Analytics & Insights
```sql
-- notifications: Notificações do sistema
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- pomodoro_sessions: Sessões Pomodoro
CREATE TABLE pomodoro_sessions (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  type VARCHAR(20),
  duration INTEGER,
  completed_at TIMESTAMP
);

-- weekly_reviews: Reviews semanais
CREATE TABLE weekly_reviews (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) REFERENCES sessions(id),
  week_start DATE,
  week_end DATE,
  answers JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Índices

```sql
-- Performance
CREATE INDEX idx_quests_session ON quests(session_id);
CREATE INDEX idx_tasks_session ON tasks(session_id);
CREATE INDEX idx_checkins_session ON daily_checkins(session_id);
CREATE INDEX idx_notifications_session ON notifications(session_id);

-- Buscas comuns
CREATE INDEX idx_quests_status ON quests(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_checkins_date ON daily_checkins(date);
```

---

## APIs

### Endpoints Principais (13 APIs)

#### 1. `/api/tasks` - Tasks Management
**Métodos:** GET, POST, PUT, DELETE

**GET /api/tasks**
```javascript
// Lista todas as tasks (opcional: ?status=pending)
Response: {
  tasks: [
    {
      id: 1,
      title: "Implementar testes",
      description: "Criar testes unitários",
      status: "pending",
      priority: "high",
      estimated_hours: 4,
      created_at: "2026-02-12T10:00:00.000Z"
    }
  ]
}
```

**POST /api/tasks**
```javascript
// Cria nova task
Request: {
  title: "Implementar testes",
  description: "Criar testes unitários",
  priority: "high",
  estimated_hours: 4,
  quest_id: 1
}
Response: { task: {...} }
```

#### 2. `/api/quests` - Quests System
**Métodos:** GET, POST, PUT, DELETE

**GET /api/quests**
```javascript
// Lista todas as quests (opcional: ?status=in_progress)
Response: {
  quests: [
    {
      id: 1,
      title: "Master Testing",
      description: "Aprender testes unitários",
      difficulty: "medium",
      current_xp: 150,
      estimated_xp: 300,
      status: "in_progress",
      milestones: [...]
    }
  ]
}
```

**POST /api/quests**
```javascript
// Cria nova quest com milestones automáticos
Request: {
  title: "Master Testing",
  description: "Aprender testes",
  difficulty: "medium",
  objective_id: 1
}
Response: {
  quest: {...},
  milestones: [...]
}
```

#### 3. `/api/objectives` - Objectives NLP
**Métodos:** GET, POST, PUT, DELETE

**POST /api/objectives**
```javascript
// Cria novo objetivo (usa Coach AI)
Request: {
  statement: "Quero correr 5km, 3x por semana"
}
Response: {
  objective: {
    id: 1,
    statement: "Correr 5km, 3x/semana",
    category: "health",
    status: "in_progress",
    details: {
      criteria_1: "Correr 5km por sessão",
      criteria_2: "Melhorar condicionamento",
      // ...
    }
  }
}
```

#### 4. `/api/coach` - Coach AI
**Métodos:** POST

**POST /api/coach**
```javascript
// Envia mensagem para o coach
Request: {
  message: "Me ajude a criar um objetivo de corrida"
}
Response: {
  response: "Vou te ajudar! Qual é a sua meta específica...",
  history: [...]
}
```

#### 5. `/api/analytics` - Analytics Dashboard
**Métodos:** GET

**GET /api/analytics?period=week**
```javascript
Response: {
  stats: [
    { date: "2026-02-10", quests_completed: 2, xp_earned: 200 },
    { date: "2026-02-11", quests_completed: 3, xp_earned: 300 }
  ],
  byDayOfWeek: [
    { day_of_week: 1, quests_completed: 5, xp_earned: 500 }
  ],
  activeHours: [...],
  objectiveProgress: [...]
}
```

#### 6. `/api/reports` - Reports
**Métodos:** GET, POST

**GET /api/reports?type=week**
```javascript
Response: {
  period: {
    start: "2026-02-05T00:00:00.000Z",
    end: "2026-02-12T00:00:00.000Z"
  },
  stats: {
    quests_completed: 5,
    milestones_completed: 15,
    xp_earned: 800
  },
  objectives: [...],
  quests: [...],
  textReport: "Weekly Report\n============="
}
```

#### 7. `/api/achievements` - Achievements
**Métodos:** GET, POST

**GET /api/achievements**
```javascript
Response: {
  achievements: [
    {
      id: 1,
      name: "First Quest",
      category: "quests",
      requirement_value: 1,
      icon: "🎯",
      description: "Complete sua primeira quest",
      unlocked: true
    }
  ],
  grouped: {
    quests: [...],
    xp: [...],
    streak: [...],
    objectives: [...]
  },
  stats: {
    total_quests: 5,
    total_xp: 800,
    longest_streak: 3,
    total_objectives: 2
  }
}
```

#### 8. `/api/insights` - AI Insights
**Métodos:** GET, POST

**GET /api/insights**
```javascript
Response: {
  insights: [
    {
      type: "most_productive_day",
      title: "Dia Mais Produtivo: Segunda",
      description: "Você completa 5 milestones em Segunda (média: 2.0).",
      impact: "high",
      recommendation: "Tente agendar tarefas importantes para Segunda."
    }
  ],
  predictions: [...],
  generatedAt: "2026-02-12T10:00:00.000Z"
}
```

#### 9. `/api/weekly-review` - Weekly Review
**Métodos:** GET, POST

**GET /api/weekly-review**
```javascript
Response: {
  period: { start: "...", end: "..." },
  stats: {
    current: { quests_completed: 5, ... },
    previous: { milestones_completed: 8, ... }
  },
  objectives: [...],
  checkins: [...],
  questions: [...],
  reviewText: "Weekly review completa...",
  generatedAt: "..."
}
```

#### 10. `/api/notifications` - Notifications
**Métodos:** GET, POST, PUT, DELETE

#### 11. `/api/daily-checkin` - Daily Check-ins
**Métodos:** GET, POST

#### 12. `/api/quests/from-objective` - Converter Objetivo em Quest
**Métodos:** POST

#### 13. `/api/objectives/[id]` - Objetivo Individual
**Métodos:** GET, PUT, DELETE

---

## Frontend

### Páginas Implementadas (10)

#### 1. Home (`/`)
**Componentes:**
- TopNavigation
- QuickActions
- Stats cards
- Links para features

**Features:**
- Visão geral de stats
- Acesso rápido a features
- Navegação intuitiva

#### 2. Coach (`/coach`)
**Componentes:**
- Chat interface
- Histórico de mensagens
- Sugestões de prompts
- Loading/typing indicators

**Features:**
- Chat conversacional
- Input de texto
- Envio com Enter
- Shift+Enter para nova linha

#### 3. Objectives (`/objectives`)
**Componentes:**
- Lista de objetivos
- Filtros de status
- Barra de progresso
- Badges de categoria

**Features:**
- CRUD de objetivos
- Criar quest a partir de objetivo
- Ver memória
- Editar/Arquivar

#### 4. Quests (`/quests`)
**Componentes:**
- Lista de quests
- Cards de dificuldade
- Progress bar
- Milestones expandidos

**Features:**
- CRUD de quests
- Ver detalhes
- Editar/Arquivar
- Completar milestones

#### 5. Tasks (`/tasks`)
**Componentes:**
- Lista de tarefas
- PomodoroTimer integrado
- Filtros de status
- Ordenação por prioridade

**Features:**
- CRUD de tasks
- Quick add
- Completar com checkbox
- Associação com quests

#### 6. Daily Check-in (`/daily`)
**Componentes:**
- Mood selector (emojis)
- Campos de texto
- Histórico de check-ins
- Memory view

**Features:**
- Check-in diário
- Mood tracking
- Gratitude journaling
- Highlights/Challenges

#### 7. Analytics (`/analytics`)
**Componentes:**
- Gráficos de barras
- Heatmaps
- Linhas de tendência
- Select de período

**Features:**
- Analytics por semana/mês
- Distribuição por dia da semana
- Tendência de tarefas
- Progresso de objetivos

#### 8. Reports (`/reports`)
**Componentes:**
- Select de tipo (semana/mês)
- Preview ASCII
- Botão de download
- Histórico de reports

**Features:**
- Gerar report semanal/mensal
- Exportar como texto
- Comparação de períodos

#### 9. Achievements (`/achievements`)
**Componentes:**
- Grid de achievements
- Filtragem por categoria
- Progress bars
- Toast notifications

**Features:**
- 17 achievements
- 4 categorias
- Auto-unlock
- Progress tracking

#### 10. Insights (`/insights`)
**Componentes:**
- Dashboard unificado
- AI insights cards
- Weekly reviews
- Recommendations

**Features:**
- Insights automáticos
- Previsões de conclusão
- Padrões de produtividade
- Reviews semanais

### Componentes Reutilizáveis

#### TopNavigation
**Props:** Nenhum (usa useRouter)

**Features:**
- 10 itens de navegação
- Página ativa destacada
- 60px de altura fixa
- Dark theme

#### PomodoroTimer
**Props:**
- `onSessionComplete: (session) => void`

**Features:**
- Timer 25/5/15 min
- Auto switch
- Contador de pomodoros
- Notificações nativas

#### QuickActions
**Props:** Nenhum

**Features:**
- 4 ações rápidas
- Modais interativos
- Navegação inteligente

---

## Testes

### Cobertura Atual: 70% ✅

### Estatísticas de Testes
- **Total de testes:** 225+
- **Arquivos de teste:** 22
- **Tempo de execução:** ~10s
- **Cobertura de código:** 70%

### Testes por Categoria

#### Componentes (15 testes)
- ✅ PomodoroTimer.test.js (6 testes)
- ✅ TopNavigation.test.js (6 testes)
- ✅ QuickActions.test.js (6 testes)

#### Páginas (68 testes)
- ✅ home.test.js (9 testes)
- ✅ objectives.test.js (10 testes)
- ✅ coach.test.js (14 testes)
- ✅ quests.test.js (15 testes)
- ✅ tasks.test.js (20 testes)

#### APIs (75 testes)
- ✅ tasks.test.js (12 testes)
- ✅ quests.test.js (8 testes)
- ✅ objective-id.test.js (7 testes)
- ✅ coach.test.js (7 testes)
- ✅ achievements.test.js (4 testes)
- ✅ insights.test.js (5 testes)
- ✅ weekly-review.test.js (5 testes)
- ✅ analytics.test.js (11 testes)
- ✅ reports.test.js (16 testes)

#### Bibliotecas (67 testes)
- ✅ auth-helpers.test.js (15 testes)
- ✅ db.test.js (21 testes)
- ✅ insights.test.js (7 testes)
- ✅ openai.test.js (10 testes)
- ✅ daily-checkin.test.js (14 testes)

### Como Rodar os Testes

```bash
# Todos os testes
npm test

# Modo watch (desenvolvimento)
npm run test:watch

# Com coverage
npm run test:coverage

# Teste específico
npm test -- --testNamePattern="PomodoroTimer"

# Teste de arquivo específico
npm test -- __tests__/components/PomodoroTimer.test.js
```

### Estrutura de Testes

**Padrão AAA:**
```javascript
test('deve renderizar timer com 25 minutos', () => {
  // Arrange
  render(<PomodoroTimer />);

  // Act
  const timer = screen.getByText('25:00');

  // Assert
  expect(timer).toBeInTheDocument();
});
```

### Features Bem Cobertas (70%+)
- ✅ Pomodoro Timer (100%)
- ✅ TopNavigation (90%)
- ✅ Auth System (80%)
- ✅ Tasks Management (80%)
- ✅ Database (75%)
- ✅ Quests System (75%)
- ✅ AI Insights (75%)
- ✅ Home Page (75%)
- ✅ Coach Page (75%)
- ✅ Quests Page (75%)
- ✅ Tasks Page (80%)
- ✅ Analytics API (75%)
- ✅ Reports API (75%)
- ✅ Objectives NLP (70%)
- ✅ Coach AI (70%)
- ✅ Weekly Review (70%)
- ✅ Objectives Page (70%)
- ✅ Insights API (70%)
- ✅ OpenAI (70%)
- ✅ Daily Check-in (70%)
- ✅ Achievements API (65%)
- ✅ Notifications (60%)

---

## Configuração

### Variáveis de Ambiente

Crie um arquivo `.env.local`:

```bash
# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=goalsguild
PGUSER=postgres
PGPASSWORD=changeme

# OpenAI (OPCIONAL - para Coach AI)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Server
PORT=3002
NODE_ENV=development
```

### Dependências Principais

```json
{
  "dependencies": {
    "next": "^15.1.3",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "openai": "^4.77.0",
    "pg": "^8.13.1"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

---

## Como Rodar

### Pré-requisitos

- Node.js v22+
- PostgreSQL 15+
- npm ou yarn

### 1. Clonar o Repositório

```bash
cd /home/node/.openclaw/workspace/goalsguild-coach
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Banco de Dados

```bash
# Criar database
createdb goalsguild

# Rodar migrations
psql goalsguild < schema.sql
psql goalsguild < schema-achievements.sql
psql goalsguild < schema-with-auth.sql
```

### 4. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
# Editar .env.local com suas configurações
```

### 5. Rodar em Desenvolvimento

```bash
npm run dev
```

Acesse: `http://localhost:3002`

### 6. Rodar Testes

```bash
# Todos os testes
npm test

# Com coverage
npm run test:coverage

# Modo watch
npm run test:watch
```

### 7. Build para Produção

```bash
npm run build
npm start
```

---

## Deploy

### Opções de Deploy

#### 1. Vercel (Recomendado para Next.js)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Deploy de produção
vercel --prod
```

#### 2. Railway

- Criar projeto no Railway
- Adicionar PostgreSQL
- Configurar variáveis de ambiente
- Deploy automático

#### 3. Render

- Criar webhook service
- Adicionar PostgreSQL
- Configurar build command
- Configurar start command

#### 4. Self-Hosted (VPS)

```bash
# Usar PM2
npm install -g pm2
pm2 start npm --name "goalsguild" -- start
pm2 save
pm2 startup
```

### Variáveis de Ambiente de Produção

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
OPENAI_API_KEY=sk-your-key
```

---

## Estrutura de Arquivos

```
goalsguild-coach/
├── app/
│   ├── page.js                          # Home page
│   ├── layout.js                        # Root layout
│   ├── globals.css                      # Estilos globais
│   │
│   ├── components/                      # Componentes reutilizáveis
│   │   ├── TopNavigation.js            # Barra de navegação
│   │   ├── PomodoroTimer.js            # Timer Pomodoro
│   │   └── QuickActions.js             # Ações rápidas
│   │
│   ├── lib/                            # Bibliotecas utilitárias
│   │   ├── auth-helpers.js             # Autenticação
│   │   ├── db.js                       # Pool PostgreSQL
│   │   ├── openai.js                   # Integração OpenAI
│   │   ├── insights.js                 # Análise de insights
│   │   ├── notifications.js            # Sistema de notificações
│   │   ├── weekly-review.js            # Reviews semanais
│   │   └── nlp-coach-prompt.js         # Prompt do Coach AI
│   │
│   ├── api/                            # API Routes
│   │   ├── tasks/route.js              # Tasks CRUD
│   │   ├── quests/route.js             # Quests CRUD
│   │   ├── quests/from-objective/       # Converter objetivo em quest
│   │   ├── objectives/route.js         # Objectives CRUD
│   │   ├── objectives/[id]/route.js    # Objective individual
│   │   ├── objectives/[id]/memory/     # Memory de objetivo
│   │   ├── coach/route.js              # Coach AI
│   │   ├── analytics/route.js          # Analytics
│   │   ├── reports/route.js            # Reports
│   │   ├── achievements/route.js       # Achievements
│   │   ├── insights/route.js           # Insights
│   │   ├── weekly-review/route.js      # Weekly Review
│   │   ├── notifications/route.js      # Notifications
│   │   ├── daily-summary/route.js      # Daily summary
│   │   └── reminders/route.js          # Reminders
│   │
│   └── [pages]/                        # Páginas principais
│       ├── page.js                     # Home
│       ├── coach/page.js               # Coach AI
│       ├── objectives/page.js          # Objectives
│       ├── quests/page.js              # Quests
│       ├── tasks/page.js               # Tasks
│       ├── daily/page.js               # Daily Check-in
│       ├── analytics/page.js           # Analytics
│       ├── reports/page.js             # Reports
│       ├── achievements/page.js        # Achievements
│       └── insights/page.js           # Insights
│
├── __tests__/                          # Testes
│   ├── components/                     # Testes de componentes
│   ├── pages/                          # Testes de páginas
│   ├── api/                           # Testes de APIs
│   └── lib/                           # Testes de bibliotecas
│
├── scripts/                            # Scripts utilitários
│   ├── setup-daily-summary.sh          # Configurar cron
│   └── process-daily-summary.js        # Processar check-ins
│
├── schema.sql                          # Schema principal
├── schema-achievements.sql             # Schema de achievements
├── schema-with-auth.sql                # Schema de autenticação
├── .env.example                       # Template de env
├── .env.local                         # Variáveis locais
├── jest.config.js                     # Configuração Jest
├── next.config.js                     # Configuração Next.js
├── package.json                       # Dependências
└── README.md                          # Este arquivo
```

---

## Guia de Desenvolvimento

### Adicionar Nova Feature

1. **Criar API Route**
```bash
# Criar arquivo em app/api/[feature]/route.js
export async function GET(request) { ... }
export async function POST(request) { ... }
```

2. **Criar Página**
```bash
# Criar arquivo em app/[feature]/page.js
export default function FeaturePage() { ... }
```

3. **Adicionar Navegação**
```bash
# Editar app/components/TopNavigation.js
# Adicionar link para nova feature
```

4. **Criar Testes**
```bash
# Criar testes em __tests__/
npm test -- __tests__/[feature]/[feature].test.js
```

5. **Documentar**
```bash
# Atualizar README.md com documentação
```

### Convenções de Código

**JavaScript:**
- camelCase para variáveis
- PascalCase para componentes
- UPPER_CASE para constantes
- Async/await para código assíncrono

**CSS:**
- Dark theme: `#0a0a0a` background
- Accent color: `#fbbf24` (amarelo)
- Tailwind-style utilities

**SQL:**
- snake_case para tabelas/colunas
- Índices: `idx_[table]_[column]`
- Foreign keys: `[table]_[id]`

### Git Workflow

```bash
# Branch feature
git checkout -b feature/nova-feature

# Commits descritivos
git add .
git commit -m "feat: Add nova feature"

# Push
git push origin feature/nova-feature

# Pull request
# Aguardar review
# Merge para main
```

---

## Roadmap

### Concluído ✅
- [x] Frontend completo (10 páginas)
- [x] Backend completo (13 APIs)
- [x] Testes (70% cobertura)
- [x] Documentação
- [x] Sistema gamificado
- [x] Analytics & insights
- [x] Notificações
- [x] Daily check-ins

### Em Progresso 🚧
- [ ] Integração completa OpenAI
- [ ] Testes E2E
- [ ] CI/CD pipeline

### Futuro 🔮
- [ ] App mobile (PWA)
- [ ] Integração com Google Calendar
- [ ] Integração com Notion
- [ ] Social features (accountability partners)
- [ ] Multiplayer quests
- [ ] Leaderboards
- [ ] Premium features

---

## Suporte

### Documentação Relacionada
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [OpenAI Docs](https://platform.openai.com/docs)
- [Jest Docs](https://jestjs.io/docs/getting-started)

### Comunidade
- GitHub Issues
- Discord: [link quando disponível]

### Licença
MIT

---

## Autores

**Desenvolvido por:** Andres e Jarbas 🦅

**Data:** Fevereiro 2026

**Versão:** 1.0.0

---

**Muito obrigado por usar GoalsGuild Coach!** 🎉
