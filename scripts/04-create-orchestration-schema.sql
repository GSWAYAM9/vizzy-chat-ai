-- Agent Orchestration & Logging - DASP 1.2

-- Orchestration logs (for quality monitoring and debugging)
CREATE TABLE IF NOT EXISTS orchestration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  request_id VARCHAR(100) NOT NULL,
  
  -- Orchestration details
  routing_type VARCHAR(50), -- direct_api, agent_activation, orchestrated, parallel, sequential
  agents_executed TEXT[], -- Array of agent IDs
  
  -- Execution metrics
  status VARCHAR(50), -- completed, partial_failure, failed
  processing_time_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  fallback_used BOOLEAN DEFAULT FALSE,
  
  -- Metadata and debugging
  metadata JSONB,
  error_messages TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent execution history (per-agent tracking)
CREATE TABLE IF NOT EXISTS agent_execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orchestration_id VARCHAR(100),
  agent_id VARCHAR(50) NOT NULL,
  request_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Execution details
  status VARCHAR(50), -- completed, partial, failed, timeout
  processing_time_ms INTEGER,
  input_data JSONB,
  output_data JSONB,
  
  -- Error tracking
  error_message TEXT,
  fallback_used BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agent availability and health
CREATE TABLE IF NOT EXISTS agent_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id VARCHAR(50) NOT NULL UNIQUE,
  
  -- Health metrics
  is_available BOOLEAN DEFAULT TRUE,
  success_rate NUMERIC(5,2), -- 0-100%
  average_response_time_ms INTEGER,
  current_queue_length INTEGER DEFAULT 0,
  
  -- Status
  last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_failure_at TIMESTAMP,
  consecutive_failures INTEGER DEFAULT 0,
  
  metadata JSONB,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_orchestration_logs_user_id ON orchestration_logs(user_id);
CREATE INDEX idx_orchestration_logs_created_at ON orchestration_logs(created_at DESC);
CREATE INDEX idx_orchestration_logs_status ON orchestration_logs(status);
CREATE INDEX idx_orchestration_logs_orchestration_id ON orchestration_logs(orchestration_id);

CREATE INDEX idx_agent_execution_history_agent_id ON agent_execution_history(agent_id);
CREATE INDEX idx_agent_execution_history_user_id ON agent_execution_history(user_id);
CREATE INDEX idx_agent_execution_history_created_at ON agent_execution_history(created_at DESC);

CREATE INDEX idx_agent_health_agent_id ON agent_health(agent_id);
CREATE INDEX idx_agent_health_is_available ON agent_health(is_available);
