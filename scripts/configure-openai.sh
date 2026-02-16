#!/bin/bash

# Script para configurar OpenAI API Key
echo "🔑 Configurando OpenAI API para GoalsGuild Coach"
echo ""
echo "Por favor, cole sua OpenAI API Key abaixo:"
echo "(Formato: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx)"
echo ""
read -p "OpenAI API Key: " api_key

# Verificar formato
if [[ ! $api_key =~ ^sk-proj-[a-zA-Z0-9_-]{48,}$ ]]; then
    echo "❌ Formato inválido! A chave deve começar com 'sk-proj-'"
    exit 1
fi

# Fazer backup do arquivo atual
cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)

# Atualizar a chave
if grep -q "OPENAI_API_KEY=" .env.local; then
    # Chave já existe, atualizar
    sed -i "s/^OPENAI_API_KEY=.*/OPENAI_API_KEY=$api_key/" .env.local
    echo "✅ Chave atualizada em .env.local"
else
    # Adicionar chave
    echo "" >> .env.local
    echo "# OpenAI API Key" >> .env.local
    echo "OPENAI_API_KEY=$api_key" >> .env.local
    echo "✅ Chave adicionada em .env.local"
fi

echo ""
echo "🔄 Reiniciando servidor..."
pkill -f "next-server" 2>/dev/null
sleep 2
npm run dev > logs/server.log 2>&1 &
sleep 3

echo "✅ Servidor reiniciado!"
echo ""
echo "🧪 Testando Coach..."
sleep 20

# Testar Coach
TOKEN=$(node scripts/test-login-get-token.js 2>&1 | grep -oP 'Token: \K.*')

curl -s -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"message":"Ola! Quero definir um objetivo bem estruturado."}'

echo ""
echo "✅ Configuração completa!"
echo ""
echo "Acesse o Coach em: http://localhost:3002/coach"
