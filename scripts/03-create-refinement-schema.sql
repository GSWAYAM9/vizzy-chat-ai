-- User Signals & Refinement Data - DASP 1.2

-- User signals table (for trend analysis and refinement)
CREATE TABLE IF NOT EXISTS user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Signal metadata
  signal_type VARCHAR(100) NOT NULL, -- explicit, implicit, journal, wearable, weather, etc
  source VARCHAR(100), -- Where the signal came from
  
  -- Signal data (stored as JSONB for flexibility)
  signal_data JSONB NOT NULL,
  
  -- Confidence and context
  confidence NUMERIC(3,2) DEFAULT 1.0,
  context JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Retention (keep signals for 90 days)
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '90 days'
);

-- Refinement task tracking
CREATE TABLE IF NOT EXISTS refinement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Task metadata
  task_type VARCHAR(50) NOT NULL, -- sentiment_analysis, trend_detection, evolution_analysis
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  trigger_source VARCHAR(100),
  
  -- Data
  input_data JSONB,
  output_data JSONB,
  suggestions JSONB[],
  
  -- Error tracking
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

-- Signal aggregation (materialized view for performance)
CREATE TABLE IF NOT EXISTS signal_aggregation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Time window
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  
  -- Aggregated data
  signal_count INTEGER DEFAULT 0,
  top_styles TEXT[],
  top_colors TEXT[],
  top_moods TEXT[],
  primary_interests TEXT[],
  emotional_trends JSONB,
  behavioral_patterns JSONB,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_signals_user_id ON user_signals(user_id);
CREATE INDEX idx_user_signals_created_at ON user_signals(created_at DESC);
CREATE INDEX idx_user_signals_signal_type ON user_signals(signal_type);
CREATE INDEX idx_user_signals_expires_at ON user_signals(expires_at);

CREATE INDEX idx_refinement_tasks_user_id ON refinement_tasks(user_id);
CREATE INDEX idx_refinement_tasks_status ON refinement_tasks(status);
CREATE INDEX idx_refinement_tasks_created_at ON refinement_tasks(created_at DESC);

CREATE INDEX idx_signal_aggregation_user_id ON signal_aggregation(user_id);
CREATE INDEX idx_signal_aggregation_window_start ON signal_aggregation(window_start DESC);
