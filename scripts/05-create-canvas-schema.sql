-- Vizzy Creation Canvas - DASP 1.2

-- Canvas sessions (chat threads)
CREATE TABLE IF NOT EXISTS canvas_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session metadata
  title VARCHAR(255),
  
  -- Session data
  messages JSONB DEFAULT '[]'::jsonb,
  outputs JSONB DEFAULT '[]'::jsonb,
  iterations JSONB DEFAULT '[]'::jsonb,
  session_memory TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  archived_at TIMESTAMP
);

-- Canvas outputs (all creative outputs)
CREATE TABLE IF NOT EXISTS canvas_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES canvas_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Output metadata
  output_type VARCHAR(50), -- visual, video, audio, text, narrative, curated
  title VARCHAR(255),
  description TEXT,
  
  -- Content
  content_url TEXT,
  content_metadata JSONB,
  
  -- Generation details
  generated_by VARCHAR(50), -- Agent ID
  generation_params JSONB,
  
  -- User interaction
  rating INTEGER, -- 1-5
  is_saved BOOLEAN DEFAULT FALSE,
  is_shared BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  saved_at TIMESTAMP,
  shared_at TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Canvas iterations (refinements)
CREATE TABLE IF NOT EXISTS canvas_iterations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES canvas_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  original_output_id UUID REFERENCES canvas_outputs(id) ON DELETE CASCADE,
  
  -- Iteration details
  iteration_number INTEGER NOT NULL,
  action VARCHAR(50), -- refine, adjust, replace, combine, compare
  instruction TEXT NOT NULL,
  
  -- Result
  resulting_output_id UUID REFERENCES canvas_outputs(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Canvas output variations (alternative versions)
CREATE TABLE IF NOT EXISTS canvas_output_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_output_id UUID NOT NULL REFERENCES canvas_outputs(id) ON DELETE CASCADE,
  variation_output_id UUID NOT NULL REFERENCES canvas_outputs(id) ON DELETE CASCADE,
  
  variation_index INTEGER,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User output library (saved outputs)
CREATE TABLE IF NOT EXISTS user_output_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  output_id UUID NOT NULL REFERENCES canvas_outputs(id) ON DELETE CASCADE,
  
  -- Organization
  collection_name VARCHAR(255),
  tags TEXT[],
  
  -- Metadata
  is_favorite BOOLEAN DEFAULT FALSE,
  share_token VARCHAR(100), -- For public sharing
  
  -- Timestamps
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  shared_at TIMESTAMP,
  
  UNIQUE(user_id, output_id)
);

-- Canvas metrics (usage analytics)
CREATE TABLE IF NOT EXISTS canvas_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES canvas_sessions(id) ON DELETE SET NULL,
  
  -- Activity
  messages_sent INTEGER DEFAULT 0,
  outputs_created INTEGER DEFAULT 0,
  iterations_performed INTEGER DEFAULT 0,
  outputs_saved INTEGER DEFAULT 0,
  
  -- Engagement
  average_output_rating NUMERIC(3,2),
  favorite_output_type VARCHAR(50),
  favorite_agent VARCHAR(50),
  
  -- Session duration
  session_duration_seconds INTEGER,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_canvas_sessions_user_id ON canvas_sessions(user_id);
CREATE INDEX idx_canvas_sessions_created_at ON canvas_sessions(created_at DESC);
CREATE INDEX idx_canvas_sessions_is_active ON canvas_sessions(is_active);

CREATE INDEX idx_canvas_outputs_user_id ON canvas_outputs(user_id);
CREATE INDEX idx_canvas_outputs_session_id ON canvas_outputs(session_id);
CREATE INDEX idx_canvas_outputs_created_at ON canvas_outputs(created_at DESC);
CREATE INDEX idx_canvas_outputs_output_type ON canvas_outputs(output_type);

CREATE INDEX idx_canvas_iterations_user_id ON canvas_iterations(user_id);
CREATE INDEX idx_canvas_iterations_session_id ON canvas_iterations(session_id);

CREATE INDEX idx_user_output_library_user_id ON user_output_library(user_id);
CREATE INDEX idx_user_output_library_collection_name ON user_output_library(collection_name);

CREATE INDEX idx_canvas_metrics_user_id ON canvas_metrics(user_id);
CREATE INDEX idx_canvas_metrics_session_id ON canvas_metrics(session_id);
