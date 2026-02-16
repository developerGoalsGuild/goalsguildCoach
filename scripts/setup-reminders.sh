#!/bin/bash

# Script para configurar lembretes automáticos via cron
# Uso: ./setup-reminders.sh [daily|weekly|biweekly]

FREQUENCY=${1:-daily}
CRON_SCHEDULE=""

case $FREQUENCY in
  daily)
    CRON_SCHEDULE="0 9 * * *"  # Todos os dias às 9h
    ;;
  weekly)
    CRON_SCHEDULE="0 9 * * 0"  # Todo domingo às 9h
    ;;
  biweekly)
    CRON_SCHEDULE="0 9 1,15 * *"  # 1° e 15° de cada mês às 9h
    ;;
  *)
    echo "Uso: $0 [daily|weekly|biweekly]"
    exit 1
    ;;
esac

# Diretório do script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
SCRIPT_PATH="$SCRIPT_DIR/scripts/process-reminders.js"

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

# Adicionar ao crontab existente (ou criar novo)
crontab -l 2> /dev/null > $TEMP_CRON || true

# Adicionar nova entrada
echo "$CRON_SCHEDULE cd $SCRIPT_DIR && node $SCRIPT_PATH >> /var/log/goalsguild-reminders.log 2>&1" >> $TEMP_CRON

# Instalar novo crontab
crontab $TEMP_CRON

echo "✓ Lembretes configurados: $FREQUENCY"
echo "Horário: $CRON_SCHEDULE"
echo "Log: /var/log/goalsguild-reminders.log"
echo ""
echo "Para verificar: crontab -l"
echo "Para remover: crontab -e (editar manualmente)"
