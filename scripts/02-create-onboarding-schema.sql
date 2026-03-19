-- Onboarding Sessions Table - DASP 1.2

CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session state
  current_stage VARCHAR(50) NOT NULL DEFAULT 'welcome',
  stages_completed TEXT[] DEFAULT '{}',
  responses JSONB DEFAULT '[]'::jsonb,
  
  -- Progress tracking
  profile_completeness INTEGER DEFAULT 0, -- 0-100%
  is_minimum_viable BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_complete BOOLEAN DEFAULT FALSE,
  completion_status VARCHAR(20), -- 'minimum', 'complete', 'extended'
  
  -- Timestamps
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Retention
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '30 days'
);

-- Indexes
CREATE INDEX idx_onboarding_sessions_user_id ON onboarding_sessions(user_id);
CREATE INDEX idx_onboarding_sessions_is_complete ON onboarding_sessions(is_complete);
CREATE INDEX idx_onboarding_sessions_started_at ON onboarding_sessions(started_at DESC);
CREATE INDEX idx_onboarding_sessions_expires_at ON onboarding_sessions(expires_at);
