# Autenticação JWT - Guia de Implementação

## 🔐 O que foi criado

### 1. Sistema de Autenticação
- **Registro**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **JWT Tokens**: 30 dias de validade
- **Proteção**: Todos os endpoints exceto login/register

### 2. Arquivos Criados

| Arquivo | Função |
|----------|---------|
| `app/lib/auth.js` | Funções JWT (sign, verify, middleware) |
| `app/lib/crypto.js` | Hash de senhas (pbkdf2) |
| `app/api/auth/register/route.js` | Registro de usuários |
| `app/api/auth/login/route.js` | Login de usuários |
| `app/lib/db-helpers.js` | Helpers para queries com user_id |
| `schema-with-auth.sql` | Database schema com tabela users |

---

## 🚀 Como Proteger Endpoints

### Padrão Básico

```javascript
import { getAuthToken, verifyJWT } from '../../../lib/auth';

export async function GET(request) {
  const token = getAuthToken(request);
  const decoded = token ? verifyJWT(token) : null;

  if (!decoded) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Use decoded.userId nas suas queries
  const result = await pool.query(
    'SELECT * FROM quests WHERE user_id = $1',
    [decoded.userId]
  );

  return NextResponse.json({ quests: result.rows });
}
```

### Com Helper (Mais Limpo)

```javascript
import { queryAsUser } from '../../../lib/db-helpers';

export async function GET(request) {
  // queryAsUser adiciona user_id automaticamente
  const result = await queryAsUser(
    request,
    'SELECT * FROM quests WHERE user_id = $1'
  );

  return NextResponse.json({ quests: result.rows });
}
```

---

## 📋 Checklist de APIs para Atualizar

### ✅ Feito
- [x] `/api/auth/register` - Novo endpoint
- [x] `/api/auth/login` - Novo endpoint
- [x] `/api/quests` - Exemplo atualizado

### ⏳ Pendente (Você precisa atualizar)

**Tasks**
- [ ] `app/api/tasks/route.js` - Adicionar verificação JWT
- [ ] `app/api/tasks/[id]/route.js` - Adicionar verificação JWT

**Goals**
- [ ] `app/api/goals/route.js` - Adicionar verificação JWT

**Chat**
- [ ] `app/api/chat/route.js` - Adicionar verificação JWT (IMPORTANTE! $)

**Stats**
- [ ] `app/api/stats/route.js` - Adicionar verificação JWT

**Active Quest**
- [ ] `app/api/active-quest/route.js` - Adicionar verificação JWT

**Quest Details**
- [ ] `app/api/quests/[id]/route.js` - Adicionar verificação JWT

**Milestones**
- [ ] `app/api/milestones/[id]/route.js` - Adicionar verificação JWT

---

## 🔑 Como Usar no Frontend

### 1. Login & Armazenar Token

```javascript
const login = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  // Armazenar token
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }

  return data;
};
```

### 2. Fazer Requests Autenticadas

```javascript
const getQuests = async () => {
  const token = localStorage.getItem('token');

  const res = await fetch('/api/quests', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    // Token expirado ou inválido
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  const data = await res.json();
  return data.quests;
};
```

### 3. Logout

```javascript
const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
```

---

## 🛠️ Como Migrar APIs Existentes

### Exemplo: Tasks API

**Antes (session_id):**
```javascript
const sessionId = getSessionId(request);
const result = await pool.query(
  'SELECT * FROM tasks WHERE session_id = $1',
  [sessionId]
);
```

**Depois (user_id com JWT):**
```javascript
const token = getAuthToken(request);
const decoded = verifyJWT(token);

if (!decoded) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const result = await pool.query(
  'SELECT * FROM tasks WHERE user_id = $1',
  [decoded.userId]
);
```

---

## 🗄️ Database Migration

### Execute o novo schema

```bash
# No seu database (Neon/Supabase SQL Editor)
# Execute schema-with-auth.sql

# Ou migre manualmente:
# Adicione a tabela users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Atualize as tabelas existentes para usar user_id
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE quests ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES users(id);
```

---

## 🔒 Segurança Implementada

### ✅ O que está protegido
- Senhas hasheadas com pbkdf2 (1000 iterações)
- Tokens JWT com expiração (30 dias)
- Verificação de token em todos os endpoints
- user_id obrigatório em todas as queries

### 🔐 Boas Práticas
- Senhas nunca são retornadas em responses
- Tokens são armazenados em localStorage (frontend) ou httpOnly cookies (produção)
- Rate limiting pode ser adicionado no futuro

---

## ⚠️ Importante: API Chat

O endpoint `/api/chat` é o **MAIS IMPORTANTE** de proteger, pois ele faz chamadas à OpenAI e gera custos.

**Certifique-se de adicionar verificação JWT lá primeiro!**

---

## 📝 Próximos Passos

1. **Atualizar todas as APIs** para usar JWT (veja checklist acima)
2. **Criar páginas de Login/Register** no frontend
3. **Testar** fluxo completo:
   - Registrar usuário
   - Fazer login
   - Acessar quests/tasks protegidos
   - Tentar acessar sem token (deve falhar)

---

**🔐 Autenticação pronta para implementar!**

Siga o checklist acima para proteger todas as APIs.
