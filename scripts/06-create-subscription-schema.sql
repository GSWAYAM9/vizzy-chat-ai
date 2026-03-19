-- Subscription tiers and credits schema
CREATE TABLE IF NOT EXISTS subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  monthly_image_limit INTEGER NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  current_month_images INTEGER DEFAULT 0,
  billing_cycle_start DATE NOT NULL,
  billing_cycle_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- User credits
CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  available_credits INTEGER DEFAULT 0,
  total_credits_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Image usage tracking (simplified)
CREATE TABLE IF NOT EXISTS image_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_tier_id UUID NOT NULL REFERENCES subscription_tiers(id),
  created_at_utc TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit purchases history
CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credits_purchased INTEGER NOT NULL,
  cost_usd DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(255) UNIQUE,
  payment_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier_id ON user_subscriptions(tier_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_image_usage_user_id ON image_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_image_usage_created_at ON image_usage(created_at_utc);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user_id ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(payment_status);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, display_name, monthly_image_limit, price_usd, description)
VALUES 
  ('basic', 'Basic', 200, 0.00, 'Free tier with 200 images per month'),
  ('advanced', 'Advanced', 400, 9.99, 'Advanced tier with 400 images per month'),
  ('premium', 'Premium', 800, 24.99, 'Premium tier with 800 images per month')
ON CONFLICT (name) DO NOTHING;
