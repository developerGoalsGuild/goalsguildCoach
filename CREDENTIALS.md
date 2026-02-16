# 🔐 CREDENCIAIS DE TESTE - GoalsGuild Coach

## 👤 USUÁRIO DE TESTE

**Email:** `teste@goalsguild.com`
**Senha:** `teste123`
**Nome:** Usuário Teste
**ID:** ffb697c7-bdfe-47d8-a33e-cb4043746669

---

## 🌐 ACESSAR APLICAÇÃO

### Via Browser
1. Acesse: **http://localhost:3002/login**
2. Digite o email: `teste@goalsguild.com`
3. Digite a senha: `teste123`
4. Clique em "Login"

### Via API (curl)
```bash
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@goalsguild.com","password":"teste123"}'
```

### Resposta Esperada (API)
```json
{
  "user": {
    "id": "ffb697c7-bdfe-47d8-a33e-cb4043746669",
    "email": "teste@goalsguild.com",
    "name": "Usuário Teste"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📋 OUTROS COMANDOS ÚTEIS

### Ver todos os usuários
```bash
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 5432,
  database: 'goalsguild',
  user: process.env.DB_USER || 'n8n',
  password: process.env.DB_PASSWORD || '',
});
(async () => {
  const client = await pool.connect();
  const users = await client.query('SELECT id, email, name, created_at FROM users');
  console.log('USUÁRIOS CADASTRADOS:');
  users.rows.forEach((u, i) => {
    console.log(\`\${i + 1}. \${u.email} (\${u.name}) - \${u.id}\`);
  });
  await client.release();
  await pool.end();
})();
"
```

### Criar novo usuário
```bash
node scripts/create-test-user.js
```

### Resetar senha do usuário de teste
```bash
node scripts/create-test-user.js
```

---

## ⚠️  NOTAS

- Este é um ambiente de teste/desenvolvimento
- A senha é armazenada com hash seguro (PBKDF2)
- O token JWT expira em 24 horas
- Para produção, use senhas mais fortes

---

_Gerado em: 2026-02-12_
_Sistema: GoalsGuild Coach MVP_
_Versão: 1.0.0_
