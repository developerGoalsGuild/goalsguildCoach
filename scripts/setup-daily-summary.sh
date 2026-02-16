#!/bin/bash

# Script para configurar processamento diário (resumo do dia)
# Executa às 23h todos os dias

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_PATH="$SCRIPT_DIR/scripts/process-daily-summary.js"

# Verificar se o script existe
if [ ! -f "$SCRIPT_PATH" ]; then
  echo "Erro: Script não encontrado em $SCRIPT_PATH"
  exit 1
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "Erro: Node.js não encontrado"
  exit 1
fi

# Criar crontab temporário
TEMP_CRON=$(mktemp)
trap "rm -f $TEMP_CRON" EXIT

# Adicionar ao crontab existente
crontab -l 2> /dev/null > $TEMP_CRON || true

# Adicionar entrada (23h todos os dias)
echo "0 23 * * * cd $SCRIPT_DIR && node $SCRIPT_PATH >> /var/log/goalsguild-daily-summary.log 2>&1" >> $TEMP_CRON

# Instalar novo crontab
crontab $TEMP_CRON

echo "✓ Resumo diário configurado para rodar todos os dias às 23h"
echo "Log: /var/log/goalsguild-daily-summary.log"
echo ""
echo "Para verificar: crontab -l"
echo "Para remover: crontab -e (editar manualmente)"
