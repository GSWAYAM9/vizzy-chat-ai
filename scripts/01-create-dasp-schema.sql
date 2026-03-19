-- Deep User Profile (DUP) Database Schema - DASP 1.2
-- This schema stores the 6 layers of the Deep User Profile
-- All data is encrypted at rest. Profile updates are versioned.

-- Main DUP table (stores full JSON profile)
CREATE TABLE IF NOT EXISTS deep_user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  
  -- Core Profile Data (stored as JSONB for flexibility and querying)
  profile_data JSONB NOT NULL,
  
  -- Metadata
  version INTEGER DEFAULT 1,
  schema_version VARCHAR(10) DEFAULT '1.2',
  profile_completeness INTEGER DEFAULT 0, -- 0-100%
  onboarding_status VARCHAR(20) DEFAULT 'incomplete', -- incomplete, minimum, complete, extended
  
  -- Consent Settings
  data_usage_consent BOOLEAN DEFAULT FALSE,
  third_party_integration_consent BOOLEAN DEFAULT FALSE,
  wearable_data_consent BOOLEAN DEFAULT FALSE,
  journal_connection_consent BOOLEAN DEFAULT FALSE,
  music_connection_consent BOOLEAN DEFAULT FALSE,
  
  -- Connected Data Sources
  spotify_connected BOOLEAN DEFAULT FALSE,
  journal_connected BOOLEAN DEFAULT FALSE,
  journal_platform VARCHAR(50),
  calendar_connected BOOLEAN DEFAULT FALSE,
  calendar_platform VARCHAR(50),
  wearable_connected BOOLEAN DEFAULT FALSE,
  wearable_type VARCHAR(50),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_refined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  onboarding_completed_at TIMESTAMP,
  
  -- Encryption key reference (for encrypted storage)
  encryption_key_id VARCHAR(100)
);

-- Profile version history (audit trail)
CREATE TABLE IF NOT EXISTS deep_user_profile_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  profile_data JSONB NOT NULL,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '90 days' -- Keep for 90 days
);

-- Profile update events (for refinement engine tracking)
CREATE TABLE IF NOT EXISTS profile_update_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  update_type VARCHAR(50) NOT NULL, -- explicit, implicit, connected_data, ai_synthesis
  field_path VARCHAR(255) NOT NULL, -- e.g., "identity.name" or "aesthetic.visualStylePreferences"
  
  old_value JSONB,
  new_value JSONB,
  
  confidence NUMERIC(3,2) DEFAULT 1.0, -- 0.0-1.0
  source VARCHAR(100), -- where the update came from
  user_approved BOOLEAN,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile refinement tasks (for background processing)
CREATE TABLE IF NOT EXISTS profile_refinement_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  
  task_type VARCHAR(50) NOT NULL, -- sentiment_analysis, trend_detection, evolution_analysis
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  
  trigger_source VARCHAR(100), -- journal_entry, wearable_data, interaction_pattern, scheduled
  
  input_data JSONB,
  output_data JSONB,
  
  suggestions JSONB[], -- Array of suggested profile updates
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  error_message TEXT
);

-- Monthly profile summaries (for user review)
CREATE TABLE IF NOT EXISTS profile_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  
  month DATE NOT NULL, -- First day of the month
  
  key_insights TEXT[],
  emotional_trends TEXT[],
  aesthetic_evolution TEXT[],
  
  suggested_updates JSONB[], -- Array of suggested profile updates
  
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_reviewed_at TIMESTAMP
);

-- Emotional history tracking (for emotional pattern analysis)
CREATE TABLE IF NOT EXISTS emotional_history_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  
  emotional_state VARCHAR(100),
  intensity INTEGER, -- 1-10
  
  trigger TEXT,
  time_of_day VARCHAR(20),
  day_of_week VARCHAR(10),
  
  recorded_source VARCHAR(50), -- wearable, journal, explicit_input, inferred
  
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aesthetic evolution tracking
CREATE TABLE IF NOT EXISTS aesthetic_evolution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deep_user_profile_id UUID NOT NULL REFERENCES deep_user_profiles(id) ON DELETE CASCADE,
  
  change_description TEXT,
  field_affected VARCHAR(100),
  
  before_value JSONB,
  after_value JSONB,
  
  change_confidence NUMERIC(3,2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_deep_user_profiles_user_id ON deep_user_profiles(user_id);
CREATE INDEX idx_deep_user_profiles_created_at ON deep_user_profiles(created_at);
CREATE INDEX idx_deep_user_profiles_onboarding_status ON deep_user_profiles(onboarding_status);

CREATE INDEX idx_profile_update_events_user_id ON profile_update_events(user_id);
CREATE INDEX idx_profile_update_events_timestamp ON profile_update_events(timestamp DESC);
CREATE INDEX idx_profile_update_events_update_type ON profile_update_events(update_type);

CREATE INDEX idx_profile_refinement_tasks_status ON profile_refinement_tasks(status);
CREATE INDEX idx_profile_refinement_tasks_created_at ON profile_refinement_tasks(created_at);

CREATE INDEX idx_emotional_history_logs_created_at ON emotional_history_logs(created_at DESC);
CREATE INDEX idx_emotional_history_logs_emotional_state ON emotional_history_logs(emotional_state);

CREATE INDEX idx_aesthetic_evolution_logs_created_at ON aesthetic_evolution_logs(created_at DESC);
