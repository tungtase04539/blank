-- ============================================
-- ADD MISSING TABLES (Run this AFTER the main migration)
-- ============================================
-- This migration adds tables that were missing from the initial 261-line migration

-- ============================================
-- 1. GLOBAL SETTINGS TABLE
-- ============================================

-- Create global_settings table if not exists (for button URLs)
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  telegram_url TEXT,
  web_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own settings" 
  ON global_settings FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Create index
CREATE INDEX IF NOT EXISTS idx_global_settings_user_id ON global_settings(user_id);

-- ============================================
-- 2. REDIRECT URLS TABLE
-- ============================================

-- Create redirect_urls table if not exists (for random redirect)
CREATE TABLE IF NOT EXISTS public.redirect_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE redirect_urls ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own redirect URLs" 
  ON redirect_urls FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_redirect_urls_user_id ON redirect_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_redirect_urls_enabled ON redirect_urls(enabled);

-- ============================================
-- DONE! 🎉
-- ============================================

-- Verify tables were created
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('global_settings', 'redirect_urls')
ORDER BY table_name;

-- Expected output:
-- global_settings | 8192 bytes
-- redirect_urls   | 8192 bytes

