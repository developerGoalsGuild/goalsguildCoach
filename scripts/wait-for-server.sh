#!/bin/bash

echo "⏳ Aguardando o servidor iniciar..."

MAX_ATTEMPTS=30
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
    echo "Tentativa $ATTEMPT/$MAX_ATTEMPTS..."
    
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        echo ""
        echo "✅ SERVIDOR INICIADO COM SUCESSO!"
        echo ""
        echo "🌐 Servidor disponível em: http://localhost:3002"
        echo ""
        echo "📊 Verificando status..."
        curl -s http://localhost:3002 | head -10
        echo ""
        echo "🚀 APLICAÇÃO RODANDO!"
        exit 0
    fi
    
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

echo ""
echo "❌ TIMEOUT - Servidor não iniciou após $MAX_ATTEMPTS tentativas"
echo ""
echo "📝 Verificando logs:"
tail -50 logs/server.log
exit 1
