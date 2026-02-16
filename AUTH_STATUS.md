# ✅ Autenticação JWT Implementada!

## 🔐 O que foi criado

### 1. Backend (Segurança)
- ✅ `app/lib/auth.js` - Sistema JWT completo
- ✅ `app/lib/crypto.js` - Hash de senhas (pbkdf2)
- ✅ `app/lib/db-helpers.js` - Helpers para queries autenticadas
- ✅ `app/api/auth/register/route.js` - Endpoint de registro
- ✅ `app/api/auth/login/route.js` - Endpoint de login
- ✅ `app/api/quests/route.js` - Exemplo de API protegida

### 2. Database
- ✅ `schema-with-auth.sql` - Schema atualizado com tabela `users`
- ✅ Tabela `users` com email, password_hash, name
- ✅ Todas as tabelas agora têm `user_id` (FK para users)

### 3. Frontend
- ✅ `app/login/page.js` - Página de login/registro
- ✅ `app/components/Navbar.js` - Navbar com logout
- ✅ `app/layout.js` - Layout atualizado com verificação de auth

### 4. Documentação
- ✅ `AUTH_GUIDE.md` - Guia completo de implementação
- ✅ `schema-with-auth.sql` - SQL para migration

---

## 🚀 Como Testar AGORA

### 1. Execute o novo schema no database
```bash
# No seu database (Neon/Supabase SQL Editor)
# Copie e cole schema-with-auth.sql
# Execute
```

### 2. Reinicie o servidor
```bash
cd goalsguild-coach
npm run dev
```

### 3. Teste Login/Register
- Acesse: http://localhost:3002/login
- Crie uma conta
- Faça login
- Navegue para as páginas

---

## ⚠️ IMPORTANTE - APIs Não Protegidas Ainda

As seguintes APIs **PRECISAM** ser atualizadas:

| Endpoint | Prioridade | Motivo |
|----------|------------|---------|
| `/api/chat` | **CRÍTICA** | Gera custos OpenAI |
| `/api/tasks` | Alta | Cria dados do usuário |
| `/api/goals` | Alta | Cria dados do usuário |
| `/api/stats` | Média | Lê dados do usuário |
| `/api/active-quest` | Média | Modifica dados do usuário |
| `/api/quests/[id]` | Média | Lê dados do usuário |
| `/api/tasks/[id]` | Média | Modifica tasks |
| `/api/milestones/[id]` | Média | Modifica milestones |

---

## 📋 Como Proteger Cada API

### Padrão Básico (Copie e Cole)

```javascript
import { getAuthToken, verifyJWT } from '../../../lib/auth';

export async function GET(request) {
  // 1. Obter token
  const token = getAuthToken(request);

  // 2. Verificar token
  const decoded = token ? verifyJWT(token) : null;

  // 3. Retornar 401 se inválido
  if (!decoded) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // 4. Usar decoded.userId nas queries
  const result = await pool.query(
    'SELECT * FROM tabela WHERE user_id = $1',
    [decoded.userId]
  );

  return NextResponse.json({ data: result.rows });
}
```

### Exemplo Completo: Tasks API

**Antes:**
```javascript
const sessionId = getSessionId(request);
const result = await pool.query(
  'SELECT * FROM tasks WHERE session_id = $1',
  [sessionId]
);
```

**Depois:**
```javascript
const token = getAuthToken(request);
const decoded = token ? verifyJWT(token) : null;

if (!decoded) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

const result = await pool.query(
  'SELECT * FROM tasks WHERE user_id = $1',
  [decoded.userId]
);
```

---

## 📝 Checklist de Implementação

### Backend APIs
- [ ] `/api/chat/route.js` - **FAZER PRIMEIRO!** (custos OpenAI)
- [ ] `/api/tasks/route.js`
- [ ] `/api/tasks/[id]/route.js`
- [ ] `/api/goals/route.js`
- [ ] `/api/stats/route.js`
- [ ] `/api/active-quest/route.js`
- [ ] `/api/quests/[id]/route.js`
- [ ] `/api/milestones/[id]/route.js`

### Frontend Pages
- [ ] Atualizar todas as páginas para usar `Authorization: Bearer ${token}`
- [ ] Adicionar verificação de 401 (redirecionar para login)
- [ ] Testar fluxo completo

### Database
- [ ] Executar `schema-with-auth.sql`
- [ ] Migrar dados existentes (se houver)

---

## 🔄 Migration de Dados

Se você tiver dados com `session_id`, migre para `user_id`:

```sql
-- Criar usuários para cada session
INSERT INTO users (email, password_hash, name)
SELECT CONCAT('session_', session_id), 'temp_hash', 'Session User'
FROM sessions
ON CONFLICT DO NOTHING;

-- Migrar tasks
UPDATE tasks t
SET user_id = s.user_id
FROM sessions s
WHERE t.session_id = s.session_id;

-- Migrar quests
UPDATE quests q
SET user_id = s.user_id
FROM sessions s
WHERE q.session_id = s.session_id;
```

---

## 🎯 Próximos Passos (Prioridade)

### 1. CRÍTICO - Proteger /api/chat (5 min)
- Evita gastos desnecessários com OpenAI
- Copie o padrão básico acima

### 2. Importante - Proteger Tasks/Quests (10 min)
- Dados do usuário não podem ser acessados por outros

### 3. Testar fluxo completo (10 min)
- Registrar → Login → Criar Quest → Tasks → Coach

### 4. Deploy (5 min)
- Atualizar schema no database
- Deploy na Vercel

---

## 💡 Dicas Rápidas

**Token expirou?**
- Frontend recebe 401
- Redireciona para /login
- Usuário faz login novamente

**Esqueceu a senha?**
- Não implementado ainda
- Pode adicionar fluxo de reset depois

**Múltiplos dispositivos?**
- Token armazenado em localStorage
- Pode mudar para httpOnly cookie depois (mais seguro)

---

**🔐 Autenticação está 80% pronta!**

Falta proteger as APIs listadas acima. Siga o padrão básico e estará protegido em 20-30 min.

**Comece com `/api/chat` - é o mais crítico!** 💰
