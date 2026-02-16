# Deploy para Vercel - Guia Passo a Passo

> **Nota**: Execute estes passos no seu computador local, não no servidor.

---

## 📋 Pré-requisitos

1. **Conta Vercel**: https://vercel.com (free é suficiente)
2. **GitHub**: Repositório com o código
3. **Database**: PostgreSQL (Neon, Supabase ou Railway)

---

## 🚀 Passo 1: Preparar Database

### Opção A: Neon (Free tier recomendado)
```bash
# Acesse: https://neon.tech
# Crie database gratuito
# Copie connection string
```

Connection string exemplo:
```
postgresql://user:password@ep-cool-uuid.us-east-2.aws.neon.tech/neondb
```

### Opção B: Supabase
```bash
# Acesse: https://supabase.com
# Crie projeto gratuito
# Settings > Database > Connection string
```

### Opção C: Railway
```bash
# Acesse: https://railway.app
# Criar PostgreSQL
# Copie DATABASE_URL
```

---

## 🚀 Passo 2: Push para GitHub

```bash
# No seu computador
cd goalsguild-coach

# Inicialize git se necessário
git init
git add .
git commit -m "Initial commit - GoalsGuild MVP"

# Crie repositório no GitHub
git remote add origin https://github.com/YOUR_USERNAME/goalsguild-coach.git
git push -u origin main
```

---

## 🚀 Passo 3: Deploy na Vercel

### Via Dashboard (Recomendado)

1. **Acesse**: https://vercel.com/new
2. **Importe repositório** do GitHub
3. **Configure projeto**:
   - Framework Preset: **Next.js**
   - Root Directory: `./` (padrão)
   - Build Command: `npm run build` (auto-detect)

### Configure Environment Variables

Clique em **Environment Variables** e adicione:

```bash
# Database (copie do seu provider)
DATABASE_URL=postgresql://user:password@host/db

# OpenAI API Key
OPENAI_API_KEY=sk-seu-key-aqui

# App URL (auto preenchido pela Vercel)
NEXT_PUBLIC_APP_URL=@app-url
```

**Clique em Deploy** e aguarde ~2 min.

---

## 🚀 Passo 4: Run Migrations (Database Setup)

### Via psql CLI
```bash
# Conecte ao seu database
psql $DATABASE_URL

# Execute o schema (copie de app/lib/db.js)
\i schema.sql
```

### Via Supabase/Neon Dashboard
1. Acesse dashboard do provider
2. Vá em **SQL Editor**
3. Cole o schema SQL
4. Execute

### Schema SQL necessário
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) REFERENCES sessions(session_id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- (restante do schema de app/lib/db.js)
-- Veja arquivo completo para todas as tabelas
```

---

## 🚀 Passo 5: Teste

### Acesse sua URL Vercel
```
https://seu-projeto.vercel.app
```

### Teste
- ✅ Homepage carrega
- ✅ Criar quest funciona
- ✅ Coach AI responde (com API key)
- ✅ Tasks são criadas

---

## 🐛 Troubleshooting

### Erro: "Database connection failed"
- Verifique `DATABASE_URL` está correta
- Confirme que o database existe
- Veja se as tabelas foram criadas

### Erro: "OpenAI API key not configured"
- Adicione `OPENAI_API_KEY` nas environment variables
- Redeploy após adicionar variáveis

### Erro: "Build failed"
- Delete `node_modules` e `package-lock.json`
- `npm install`
- Commit e push novamente

---

## 📊 Monitoramento

### Logs na Vercel
1. Vá ao projeto na Vercel
2. Clique em **Deployments**
3. Clique no deployment mais recente
4. Veja **Build Logs** e **Function Logs**

### Database Metrics
- **Neon Dashboard**: Monitor queries
- **Supabase Dashboard**: Analytics
- **Railway Dashboard**: Metrics

---

## 🔄 Updates Futuros

### Para fazer mudanças:
```bash
# No seu computador
# 1. Faça mudanças
# 2. Commit e push
git add .
git commit -m "Update feature"
git push

# Vercel auto-deploy!
```

### Para mudar environment variables:
1. Dashboard Vercel
2. **Settings** > **Environment Variables**
3. Adicione/edite variáveis
4. **Redeploy** para aplicar

---

## 💰 Custos

### Vercel (Hobby)
- **Free tier**: 100GB bandwidth/mês
- **Hobby**: $20/mês (500GB + analytics)
- **Pro**: $96/mês (enterprise features)

### Database
- **Neon Free**: 0.5GB storage
- **Supabase Free**: 500MB storage
- **Railway**: $5/mês (1GB)

### Estimativa MVP
- **Vercel Free**: $0/mês
- **Neon Free**: $0/mês
- **OpenAI**: ~$5-20/mês (depende de uso)

**Total MVP**: **$0-20/mês**

---

## 🚀 Próximos Passos

Após deploy funcionar:
1. Teste completo com usuário real
2. Adicione analytics (Vercel Analytics)
3. Configure domínio customizado (opcional)
4. Prepare para produção (stripe, etc.)

---

**Deploy pronto!** 🎉

Agora você tem o GoalsGuild rodando na Vercel com PostgreSQL real.
