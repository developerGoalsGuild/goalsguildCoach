# 🔧 Ambiente de Hospedagem - Diagnóstico

## 📍 Identificação do Ambiente

**Localização:** `/home/node/.openclaw/workspace/goalsguild-coach`  
**OS:** Linux 6.12.62+rpt-rpi-2712 (arm64)  
**Arquitetura:** ARM64 (Raspberry Pi)  
**Runtime:** OpenClaw Gateway  
**Data do Diagnóstico:** 12/02/2026

---

## ✅ O Que Já Está Instalado

### 1. **Node.js & npm**
- **Node.js:** v22.22.0 ✅
- **npm:** 10.9.4 ✅
- **Localização:**
  - Node: `/usr/local/bin/node`
  - npm: `/usr/local/bin/npm`

**Status:** ✅ Pronto para usar

### 2. **Git**
- **Git:** 2.39.5 ✅
- **Localização:** `/usr/bin/git`

**Status:** ✅ Pronto para usar

### 3. **OpenClaw Gateway**
- **Runtime:** OpenClaw Gateway  
- **Agent:** main  
- **Host:** raspberry  
- **Repo:** `/home/node/.openclaw/workspace`

**Status:** ✅ Rodando

---

## ❌ O Que Está Faltando

### 1. **PostgreSQL Server**
**Status:** ❌ NÃO instalado

**Diagnóstico:**
```bash
service postgresql status
# → postgresql: unrecognized service

which psql
# → (não encontrado)
```

**Necessário para:**
- Todas as APIs (13 endpoints)
- Persistência de dados
- Sistema de autenticação
- Todas as features do sistema

**Instalação Necessária:**
```bash
# Debian/Ubuntu (ARM64)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Iniciar serviço
sudo service postgresql start

# Verificar
psql --version
```

**Após Instalação:**
```bash
# Criar database
createdb goalsguild

# Configurar usuário
sudo -u postgres createuser --superuser node
sudo -u postgres psql
  ALTER USER node PASSWORD 'changeme';
  \q

# Rodar migrations
psql goalsguild < schema.sql
psql goalsguild < schema-achievements.sql
psql goalsguild < schema-with-auth.sql
```

### 2. **PostgreSQL Client (psql)**
**Status:** ❌ NÃO instalado

**Necessário para:**
- Debugar queries
- Acessar banco diretamente
- Rodar migrations manualmente

**Instalação:**
```bash
sudo apt-get install postgresql-client
```

---

## 📋 Checklist de Dependências

### Para Desenvolvimento

- [x] Node.js (v22.22.0)
- [x] npm (10.9.4)
- [x] Git (2.39.5)
- [ ] PostgreSQL Server (15+)
- [ ] PostgreSQL Client (psql)

### Para Testes

- [x] Jest (instalado via npm)
- [x] React Testing Library (instalado via npm)
- [x] Jest Environment jsdom (instalado via npm)

**Obs:** Testes já podem rodar localmente, mas não com acesso ao banco.

### Para Produção

- [ ] PostgreSQL Server configurado
- [ ] Variáveis de ambiente definidas
- [ ] Build do Next.js (`npm run build`)
- [ ] Process manager (PM2 recomendado)

---

## 🚀 Como Fazer Rodar

### Opção 1: Ambiente Completo (Recomendado)

**Requisitos:**
1. Instalar PostgreSQL Server
2. Configurar database
3. Rodar migrations
4. Configurar variáveis de ambiente
5. Instalar dependências
6. Rodar aplicação

**Passo a Passo:**

```bash
# 1. Instalar PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# 2. Iniciar serviço
sudo service postgresql start

# 3. Configurar usuário e database
sudo -u postgres createuser --superuser node
sudo -u postgres createdb goalsguild
sudo -u postgres psql
  ALTER USER node PASSWORD 'sua_senha';
  \q

# 4. Navegar para o projeto
cd /home/node/.openclaw/workspace/goalsguild-coach

# 5. Configurar variáveis de ambiente
cp .env.example .env.local
nano .env.local
# Adicionar:
# PGHOST=localhost
# PGPORT=5432
# PGDATABASE=goalsguild
# PGUSER=node
# PGPASSWORD=sua_senha
# OPENAI_API_KEY=sk-sua-key (opcional)

# 6. Instalar dependências
npm install

# 7. Rodar migrations
psql -U node -d goalsguild < schema.sql
psql -U node -d goalsguild < schema-achievements.sql
psql -U node -d goalsguild < schema-with-auth.sql

# 8. Rodar em desenvolvimento
npm run dev

# 9. Acessar
# http://localhost:3002
```

### Opção 2: Sem PostgreSQL (Limitado)

**Funcionalidades DISPONÍVEIS:**
- ✅ Frontend (páginas estáticas)
- ✅ Componentes React
- ✅ Navegação
- ✅ UI/UX

**Funcionalidades INDISPONÍVEIS:**
- ❌ Todas as APIs
- ❌ Autenticação
- ❌ Banco de dados
- ❌ Features dinâmicas

**Passo a Passo:**

```bash
# 1. Navegar para o projeto
cd /home/node/.openclaw/workspace/goalsguild-coach

# 2. Instalar dependências
npm install

# 3. Build estático
npm run build

# 4. Servir build estático
npm start

# 5. Acessar
# http://localhost:3002
# (mas não terá nenhuma funcionalidade de backend)
```

---

## 🔧 Variáveis de Ambiente Necessárias

### Mínimas (Obrigatórias)
```bash
# PostgreSQL
PGHOST=localhost
PGPORT=5432
PGDATABASE=goalsguild
PGUSER=node
PGPASSWORD=sua_senha_aqui
```

### Opcionais (Recomendadas)
```bash
# OpenAI (para Coach AI)
OPENAI_API_KEY=sk-sua-chave-aqui

# Server
PORT=3002
NODE_ENV=development
```

### Produção
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/goalsguild
OPENAI_API_KEY=sk-sua-chave
```

---

## 📊 Status Atual do Projeto no Ambiente

### Estrutura de Arquivos
```
/home/node/.openclaw/workspace/goalsguild-coach/
├── app/               ✅ Frontend completo
├── __tests__/         ✅ 225+ testes
├── scripts/           ✅ Scripts utilitários
├── schema*.sql        ✅ Schemas do banco
├── package.json       ✅ Dependências
├── next.config.js     ✅ Config Next.js
├── jest.config.js     ✅ Config Jest
└── .env.local        ⚠️ Vazio (OPENAI_API_KEY faltando)
```

### Instalação de Dependências
- **node_modules/:** ❌ Não instalado
- **Próximo passo:** `npm install`

### Build
- **.next/:** ✅ Build existe (parcial)
- **Próximo passo:** `npm run build`

---

## 🎯 Recomendação Oficial

### Para Desenvolvimento Completo:

1. **Instalar PostgreSQL Server** (OBRIGATÓRIO)
   ```bash
   sudo apt-get install postgresql postgresql-contrib
   ```

2. **Instalar psql** (OBRIGATÓRIO)
   ```bash
   sudo apt-get install postgresql-client
   ```

3. **Configurar Database**
   ```bash
   createdb goalsguild
   ```

4. **Instalar Dependências**
   ```bash
   npm install
   ```

5. **Configurar Variáveis**
   ```bash
   cp .env.example .env.local
   # Editar .env.local
   ```

6. **Rodar Migrations**
   ```bash
   psql goalsguild < schema.sql
   ```

7. **Rodar App**
   ```bash
   npm run dev
   ```

---

## 💡 Alternativa: Deploy em Nuvem

### Vercel (Recomendado)

**Vantagens:**
- ✅ Zero configuração
- ✅ PostgreSQL integrado (Vercel Postgres)
- ✅ Deploy automático
- ✅ HTTPS automático
- ✅ CDN global
- ✅ CI/CD embutido

**Passos:**
1. Criar conta em Vercel
2. Conectar repositório Git
3. Adicionar Vercel Postgres
4. Configurar variáveis de ambiente
5. Deploy automático

**Custo:**
- PostgreSQL grátis (256MB)
- Deploy grátis
- Domínio personalizado pago

---

## 📋 Resumo

### ✅ Pronto:
- Node.js v22.22.0
- npm 10.9.4
- Git 2.39.5

### ❌ Faltando:
- PostgreSQL Server (CRÍTICO)
- PostgreSQL Client
- Variáveis de ambiente

### 🔧 Próximos Passos:
1. Instalar PostgreSQL Server
2. Configurar database
3. Instalar dependências (`npm install`)
4. Configurar variáveis de ambiente
5. Rodar migrations
6. Iniciar aplicação

---

## 🆘 Ajuda Rápida

### Verificar se PostgreSQL está rodando:
```bash
sudo service postgresql status
```

### Verificar se psql está instalado:
```bash
which psql
psql --version
```

### Verificar conexão com banco:
```bash
psql -U node -d goalsguild -c "SELECT 1;"
```

### Verificar se Node está funcionando:
```bash
node --version
npm --version
```

### Instalar dependências:
```bash
npm install
```

### Rodar aplicação:
```bash
npm run dev
```

---

**Diagnóstico Completo - Ambiente de Hospedagem**  
**Data:** 12/02/2026  
**Status:** ⚠️ Requer PostgreSQL para funcionar
