-- Users table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_prompt TEXT NOT NULL,
  refined_prompt TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES prompts(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  fal_image_id VARCHAR(255),
  fal_request_id VARCHAR(255),
  image_size VARCHAR(50),
  generation_model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analysis cache table
CREATE TABLE IF NOT EXISTS image_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  analysis_text TEXT NOT NULL,
  analysis_model VARCHAR(100),
  analysis_tokens_used INT,
  cached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(image_id)
);

-- Batch generation jobs table
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_name VARCHAR(255),
  prompts TEXT[] NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  total_images INT DEFAULT 0,
  generated_images INT DEFAULT 0,
  failed_images INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Batch job images
CREATE TABLE IF NOT EXISTS batch_job_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- pending, completed, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gallery (user's saved/favorited images)
CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  saved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, image_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_image_analysis_image_id ON image_analysis(image_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_user_id ON gallery_items(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_favorite ON gallery_items(is_favorite) WHERE is_favorite = TRUE;

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_job_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own prompts" ON prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create prompts" ON prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own images" ON images
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create images" ON images
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own image analysis" ON image_analysis
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM images WHERE images.id = image_analysis.image_id AND images.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own batch jobs" ON batch_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create batch jobs" ON batch_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own gallery" ON gallery_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own gallery" ON gallery_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gallery" ON gallery_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gallery items" ON gallery_items
  FOR DELETE USING (auth.uid() = user_id);
