# 🚀 Guia Rápido - GoalsGuild Coach

## Setup em 5 Minutos

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```bash
createdb goalsguild
psql goalsguild < schema.sql
psql goalsguild < schema-achievements.sql
psql goalsguild < schema-with-auth.sql
```

### 3. Configurar Variáveis
```bash
cp .env.example .env.local
# Editar .env.local:
# - PGUSER, PGPASSWORD
# - OPENAI_API_KEY (opcional)
```

### 4. Rodar!
```bash
npm run dev
```

Acesse: `http://localhost:3002`

---

## 📖 Como Usar Cada Feature

### 1. Criar Objetivo

**Via Coach AI:**
1. Acesse `/coach`
2. Digite: "Quero correr 5km, 3x por semana"
3. Coach ajuda a refinar
4. Objetivo criado automaticamente

**Diretamente:**
1. Acesse `/objectives`
2. Clique "➕ Criar Objetivo"
3. Preencha statement
4. Clique "Criar"

### 2. Criar Quest

**A partir de Objetivo:**
1. Acesse `/objectives`
2. Clique "⚔️ Criar Quest" no objetivo
3. Escolha dificuldade
4. Milestones criados automaticamente

**Diretamente:**
1. Acesse `/quests`
2. Clique "➕ Criar Quest"
3. Preencha título, descrição, dificuldade
4. Clique "Criar"

### 3. Adicionar Tasks

**Via Página Tasks:**
1. Acesse `/tasks`
2. Clique "➕ Criar Task"
3. Preencha título, descrição, prioridade
4. Clique "Criar"

**Quick Add:**
1. Use input "Adicionar task..."
2. Digite título
3. Pressione Enter

### 4. Fazer Daily Check-in

1. Acesse `/daily`
2. Selecione mood (😊 😐 😔)
3. Preencha gratidão, highlights, challenges, metas
4. Clique "Salvar Check-in"
5. Resumo automático às 23h

### 5. Ver Analytics

1. Acesse `/analytics`
2. Selecione período (semana/mês)
3. Veja gráficos e métricas
4. Analise padrões de produtividade

### 6. Gerar Report

1. Acesse `/reports`
2. Selecione tipo (semana/mês)
3. Clique "Gerar Report"
4. Clique "Download .txt" para exportar

### 7. Ver Achievements

1. Acesse `/achievements`
2. Veja 17 achievements
3. Desbloqueie automaticamente
4. Toast notifications ao desbloquear

### 8. Usar Pomodoro Timer

1. Acesse `/tasks`
2. Timer aparece na página
3. Clique "▶️ Iniciar" para começar
4. Pausa automática após 25 min
5. Longa pausa após 4 pomodoros

### 9. Ver Insights

1. Acesse `/insights`
2. Insights automáticos com IA
3. Padrões de produtividade
4. Previsões de conclusão
5. Reviews semanais

---

## 🎯 Fluxo de Trabalho Sugerido

### Manhã (9h)
1. **Fazer Check-in** (`/daily`)
2. **Ver Tasks do Dia** (`/tasks`)
3. **Iniciar Pomodoro** (timer)

### Durante o Dia
1. **Trabalhar com Pomodoro** (25/5 min)
2. **Completar Tasks** (marcar checkbox)
3. **Completar Milestones** (`/quests`)

### Tarde (21h)
1. **Fazer Check-in** (`/daily`)
2. **Ver Analytics** (`/analytics`)
3. **Ajustar Metas** (`/objectives`)

### Domingo (10h)
1. **Ver Weekly Review** (`/insights`)
2. **Responder perguntas**
3. **Planejar próxima semana**

---

## 💡 Dicas de Produtividade

### Objetivos Bem-Formados
- ✅ Específico: "Correr 5km, 3x/semana"
- ❌ Vago: "Exercitar mais"

### Quests Realistas
- ✅ Easy: Tasks simples (50-100 XP)
- ✅ Medium: 3-7 dias (150-300 XP)
- ✅ Hard: 1-2 semanas (400-600 XP)
- ✅ Epic: Projetos grandes (700-800 XP)

### Tasks Eficazes
- ✅ Pequenas e acionáveis (< 4h)
- ✅ Prioridade clara (high/medium/low)
- ✅ Associadas a quests

### Check-ins Consistentes
- ✅ Manhã e noite
- ✅ Seja honesto com mood
- ✅ Revise highlights e challenges

---

## 🔧 Troubleshooting

### Banco de Dados Não Conecta
```bash
# Verificar se PostgreSQL está rodando
sudo service postgresql status

# Iniciar se necessário
sudo service postgresql start

# Verificar database
psql -l | grep goalsguild
```

### Coach AI Não Funciona
- ⚠️ **Requer OpenAI API key**
- Adicione em `.env.local`:
  ```
  OPENAI_API_KEY=sk-your-key-here
  ```

### Testes Falhando
```bash
# Limpar cache do Jest
rm -rf node_modules/.cache
npm test -- --clearCache

# Reinstalar dependências
rm -rf node_modules
npm install
```

### Pomodoro Não Notifica
- Verificar permissões do navegador
- Permitir notificações em `localhost:3002`

### Analytics Vazio
- Criar algumas quests e tasks
- Completar milestones
- Fazer check-ins por 7 dias

---

## 📊 Métricas de Sucesso

### XP Ganho
- **1ª semana:** 500-1000 XP
- **1º mês:** 3000-5000 XP
- **3 meses:** 10000+ XP

### Níveis
- **Nível 1-3:** Iniciante
- **Nível 4-7:** Intermediário
- **Nível 8-10:** Avançado
- **Nível 11+:** Mestre

### Streaks
- **3 dias:** Começo bom
- **7 dias:** Hábito formando
- **30 dias:** Hábito sólido
- **100+ dias:** Lendário

---

## 🎨 Customização

### Cores do Tema
Edite `app/globals.css`:
```css
:root {
  --bg-primary: #0a0a0a;
  --bg-secondary: #111827;
  --accent: #fbbf24;
  --text: #f3f4f6;
}
```

### Adicionar Novos Achievements
1. Insira em `achievements` table
2. Adicione lógica em `lib/achievements.js`
3. Adicione ícone e descrição

### Criar Novo Tipo de Insight
1. Adicione análise em `lib/insights.js`
2. Exponha via `/api/insights`
3. Mostre em `/insights` page

---

## 🚀 Deploy Rápido

### Vercel (Recomendado)
```bash
npm i -g vercel
vercel --prod
```

### Railway
- Conecte repo
- Add PostgreSQL
- Config env vars
- Deploy automático

### Render
- Criar webhook service
- Add PostgreSQL
- Config commands
- Deploy

---

## 📞 Suporte

### Issues
- GitHub: [criar issue](https://github.com/seu-repo/issues)

### Comunidade
- Discord: [link quando disponível]

### Documentação
- README completo: `README_COMPLETO.md`
- Testes: `__tests__/`
- API docs: Ver seção "APIs"

---

**Divirta-se sendo produtivo!** 🎉🚀
