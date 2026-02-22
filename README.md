# GoalsGuild Coach 🦅

Sistema de produtividade com gamificação, AI Coach e accountability.

## 🎯 O que é

Transforme grandes objetivos em **quests** completáveis, com **milestones**, **tasks** e um **Coach AI** que te ajuda a manter o foco.

### Features

- **🎯 Quest System** - Grandes objetivos quebrados em milestones
- **✅ Tasks** - Micro-tarefas que se ligam às quests
- **🤖 Coach AI** - Assistant de accountability com personas customizáveis
- **🔥 Streaks & XP** - Gamificação para manter engajamento
- **⏰ Time Management** - Estimativas de horas para evitar overcommitment
- **📊 Analytics** - Progress tracking e estatísticas

---

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- OpenAI API Key

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd goalsguild-coach

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
```

### Configure `.env.local`

```bash
# Database
POSTGRES_PASSWORD=changeme
POSTGRES_DB=goalsguild
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# OpenAI (obrigatório para Coach AI)
OPENAI_API_KEY=sk-...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3002
```

### Start PostgreSQL

```bash
# Docker
docker run -d \
  --name goalsguild-db \
  -e POSTGRES_PASSWORD=changeme \
  -e POSTGRES_DB=goalsguild \
  -p 5432:5432 \
  postgres:14

# Ou use seu PostgreSQL local
```

### Run

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Acesse: http://localhost:3002

---

## 📖 Como Usar

### 1. Criar uma Quest

- **Quest** = Grande objetivo (ex: "Lançar startup")
- Adicione título, descrição, dificuldade
- Defina data meta (opcional)

### 2. Adicionar Milestones

- **Milestone** = Etapa da quest (ex: "MVP ready", "First user")
- Complete milestones para ganhar XP

### 3. Criar Tasks

- **Task** = Micro-tarefa (ex: "Criar landing page")
- Tasks se ligam à quest ativa
- Estime horas para evitar overcommitment

### 4. Conversar com Coach

- Coach AI ajuda a:
  - Quebrar objetivos em micro-tarefas
  - Gerenciar tempo e prioridades
  - Identificar padrões no comportamento
- Troque **personas** (Sharp, Gentle, Aggressive, Warm)

---

## 🏗️ Arquitetura

### Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **AI**: OpenAI GPT-4o-mini
- **Styling**: Inline CSS (dark theme)

### Database Schema

```sql
sessions        -- Sessões anônimas (httpOnly cookies)
messages         -- Histórico de chat com Coach
tasks            -- Tarefas ligadas à quest ativa
quests           -- Objetivos principais com milestones
quest_milestones -- Etapas dentro das quests
quest_journal    -- Histórico de eventos da quest
goals            -- Metas de longo prazo (linkadas à quests)
user_preferences -- Preferências (persona, língua)
streaks          -- Sequências de dias ativos
```

### APIs

```
POST /api/chat          - Conversar com Coach
GET/POST /api/tasks    - Gerenciar tasks
GET/POST /api/quests   - Gerenciar quests
GET/PATCH /api/quests/[id] - Detalhes da quest
POST /api/active-quest  - Definir quest ativa
GET /api/stats          - Estatísticas e streaks
```

---

## 🎨 Personalização

### Coach Personas

O Coach tem **3 dimensões**:

1. **Tone**: `sharp` | `gentle` | `aggressive` | `warm` | `neutral`
2. **Specialization**: `productivity` | `fitness` | `career` | `general`
3. **Archetype**: `mentor` | `friend` | `drill-instructor` | `therapist`

Exemplo: "Torne o coach mais agressivo e focado em carreira"

---

## 📊 Monetização (Plano)

All prices in USD.

- **Free**: $0 — 2 objectives by AI, 2 quests by AI (per month), 10 quests manual, unlimited tasks
- **Starter**: $4.99/mo or $49.99/yr — 5 objectives by AI/mo, 10 quests by AI/mo, unlimited manual quests/tasks
- **Premium**: $9.99/mo or $99.99/yr — 15 objectives by AI/mo, 30 quests by AI/mo, unlimited manual, advanced analytics, data export, priority support

### Guild Quests (Futuro)
- **Social**: Quests compartilhadas + chat em tempo real

### Marketplace (Futuro)
- **Templates**: R$ 19-49 - Quests prontas (fitness, carreira, etc)

---

## 🚀 Deploy

### Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configure variáveis de ambiente no dashboard Vercel:
- `DATABASE_URL` (PostgreSQL connection string)
- `OPENAI_API_KEY`

### Railway/Render

Simplesmente conecte o repositório e configure as env vars.

---

## 🛠️ Development

### Estrutura

```
app/
├── api/           - API routes
│   ├── chat/      - Coach AI
│   ├── tasks/     - CRUD tasks
│   ├── quests/    - CRUD quests
│   └── stats/    - Estatísticas
├── lib/           - Utilities
│   ├── db.js      - PostgreSQL connection
│   └── openai.js  - OpenAI client
└── (pages)       - Frontend pages
```

### Adicionar Features

1. **Nova API**: Crie route em `app/api/`
2. **Nova página**: Crie arquivo `.js` em `app/`
3. **Database update**: Modifique `app/lib/db.js`

---

## 🐛 Troubleshooting

### Coach não responde
- Verifique `OPENAI_API_KEY` no `.env.local`
- Veja se a key tem créditos

### Erro de database
- Confirme que PostgreSQL está rodando
- Verifique connection string
- Veja se database `goalsguild` existe

### Build falha
- Delete `node_modules` e `package-lock.json`
- `npm install`
- `npm run build`

---

## 📝 TODO

- [ ] Pagamento/Stripe
- [ ] Mobile app (React Native)
- [ ] Guild Quests (social)
- [ ] Calendar integration
- [ ] Analytics dashboard avançado

---

## 📄 Licença

MIT

---

**Feito com 🦅 por GoalsGuild**
