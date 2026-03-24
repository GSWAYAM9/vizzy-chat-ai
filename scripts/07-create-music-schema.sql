-- Create music generations table
CREATE TABLE IF NOT EXISTS music_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  title TEXT,
  style TEXT,
  duration_seconds INT DEFAULT 30,
  audio_url TEXT,
  suno_song_id TEXT UNIQUE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  credits_used INT DEFAULT 10,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create index for querying by user
CREATE INDEX IF NOT EXISTS idx_music_user_id ON music_generations(user_id);

-- Create index for querying by suno_song_id (for status polling)
CREATE INDEX IF NOT EXISTS idx_music_suno_id ON music_generations(suno_song_id);

-- Create index for querying recent generations
CREATE INDEX IF NOT EXISTS idx_music_created_at ON music_generations(user_id, created_at DESC);

-- Create index for status tracking
CREATE INDEX IF NOT EXISTS idx_music_status ON music_generations(user_id, status);

-- Add music_generations to canvas_outputs for library view
ALTER TABLE canvas_outputs 
ADD COLUMN IF NOT EXISTS music_generation_id UUID REFERENCES music_generations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_canvas_music_gen ON canvas_outputs(music_generation_id);
