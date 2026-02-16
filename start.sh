#!/bin/bash

# GoalsGuild Coach - Start Script

export PORT=3002
export NODE_ENV=production

# PostgreSQL Configuration
export PGHOST=${PGHOST:-localhost}
export PGPORT=${PGPORT:-5432}
export PGDATABASE=${PGDATABASE:-goalsguild}
export PGUSER=${PGUSER:-postgres}
export PGPASSWORD=${PGPASSWORD:-changeme}

# OpenAI Configuration (set this before running!)
# export OPENAI_API_KEY="your-api-key-here"

echo "Starting GoalsGuild Coach on port $PORT..."
echo "PostgreSQL: $PGHOST:$PGPORT/$PGDATABASE"
echo ""

cd /home/node/.openclaw/workspace/goalsguild-coach

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install --silent
fi

# Start the server
npm start
