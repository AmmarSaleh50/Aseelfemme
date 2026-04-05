-- 005_user_settings.sql
-- User settings table for storing API keys securely
-- Run this migration after 004_seed_data.sql

-- ============================================
-- USER SETTINGS TABLE
-- Stores per-user settings like API keys
-- ============================================
CREATE TABLE user_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  gemini_api_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated at trigger
CREATE TRIGGER user_settings_updated_at BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own settings
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
