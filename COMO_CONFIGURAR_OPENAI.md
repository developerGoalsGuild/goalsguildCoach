# 🔑 Como Obter e Configurar OpenAI API Key

## Passo 1: Obter sua OpenAI API Key

1. Acesse: https://platform.openai.com/api-keys
2. Faça login com sua conta OpenAI
3. Clique em "+ Create new secret key"
4. Dê um nome (ex: "GoalsGuild Coach")
5. Copie a chave (formato: `sk-proj-...`)

⚠️ **Importante:** Guarde sua chave em segurança! Não compartilhe!

---

## Passo 2: Configurar no arquivo .env.local

### Opção A: Editar diretamente
```bash
cd /home/node/.openclaw/workspace/goalsguild-coach
nano .env.local
```

Altere a linha:
```env
OPENAI_API_KEY=sk-proj-SUA_CHAVE_AQUI
```

### Opção B: Usar comando echo
```bash
echo "OPENAI_API_KEY=sk-proj-SUA_CHAVE_AQUI" >> .env.local
```

---

## Passo 3: Reiniciar o servidor

```bash
# Parar o servidor atual
pkill -f "next-server"

# Reiniciar com a nova chave
npm run dev
```

---

## Passo 4: Testar o Coach

### Via navegador:
1. Acesse: http://localhost:3002/coach
2. Faça login
3. Converse com o Coach

### Via API:
```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Authorization: Bearer <seu-token>" \
  -d '{"message":"Olá! Como posso definir um objetivo bem estruturado?"}'
```

---

## 💰 Custos Estimados

### Modelo gpt-4o-mini (usado atualmente):
- **Input:** $0.150 por 1M tokens
- **Output:** $0.600 por 1M tokens
- **Conversa típica:** ~500 tokens input + ~200 tokens output
- **Custo por conversa:** ~$0.0002 (20 centavos de dólar)
- **100 conversas:** ~$0.02 (2 centavos de dólar)

### Dica:
- O gpt-4o-mini é MUITO barato
- Para uso pessoal, custa menos de $1 por mês com uso intenso

---

## ✅ Verificar se está funcionando

Depois de configurar, o Coach vai usar OpenAI automaticamente. Você vai notar:
- Respostas mais inteligentes e contextualizadas
- Melhor compreensão de nuances
- Conversas mais naturais
- Coacheamento personalizado baseado em NLP

---

## 🔧 Troubleshooting

### Se ainda não funcionar:
1. Verifique se a chave começa com `sk-proj-`
2. Verifique se reiniciou o servidor
3. Verifique se a chave tem créditos disponíveis
4. Olhe os logs: `tail -f logs/server.log`

### Logs mostrando "Using fallback mode":
- Significa que não detectou a OpenAI API key
- Verifique se a chave está correta em .env.local
- Recarregue a página e tente novamente

---

**Pronto!** Depois de configurar, o Coach vai usar inteligência artificial real para conversas muito mais inteligentes! 🚀
