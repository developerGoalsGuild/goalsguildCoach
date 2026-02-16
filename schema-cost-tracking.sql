-- Sistema de Rastreamento de Custos por Usuário
-- GoalsGuild Coach - MVP

-- Tabela para rastrear uso de tokens e custos
CREATE TABLE IF NOT EXISTS usage_tracking (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  
  -- Tokens usados
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  
  -- Custo calculado
  input_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  output_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Metadados
  endpoint TEXT NOT NULL,
  response_time_ms INTEGER,
  status_code INTEGER,
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices
  CONSTRAINT fk_usage_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  CONSTRAINT fk_usage_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_usage_session_id ON usage_tracking(session_id);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_tracking(user_id, created_at DESC);

-- Tabela para definir orçamentos por usuário
CREATE TABLE IF NOT EXISTS user_budgets (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Orçamento mensal (em dólares)
  monthly_budget DECIMAL(10, 2) NOT NULL DEFAULT 10.00,
  
  -- Alertas
  alert_threshold_percentage INTEGER NOT NULL DEFAULT 80, -- 80% do orçamento
  alert_sent BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Reset mensal
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_budget_user_id ON user_budgets(user_id);

-- Tabela para resumos diários de custos (otimiza consultas)
CREATE TABLE IF NOT EXISTS daily_cost_summaries (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  
  -- Data do resumo
  summary_date DATE NOT NULL,
  
  -- Totais do dia
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_input_tokens INTEGER NOT NULL DEFAULT 0,
  total_output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  
  -- Custo total do dia
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  
  -- Modelos usados
  models_used TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Restrição única: um resumo por usuário por dia
  CONSTRAINT unique_user_date UNIQUE (user_id, summary_date)
);

CREATE INDEX IF NOT EXISTS idx_summary_user_date ON daily_cost_summaries(user_id, summary_date DESC);

-- Comentário
COMMENT ON TABLE usage_tracking IS 'Rastrea cada request de API com tokens e custos';
COMMENT ON TABLE user_budgets IS 'Define orçamentos mensais por usuário';
COMMENT ON TABLE daily_cost_summaries IS 'Resumos diários de custos para otimizar analytics';
