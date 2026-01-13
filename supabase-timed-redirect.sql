-- =============================================
-- 5s TIMED REDIRECT FEATURE - Database Migration
-- =============================================

-- 1. Create new table for timed redirect URLs (separate from lucky redirect)
CREATE TABLE IF NOT EXISTS timed_redirect_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add timed redirect settings to global_settings
ALTER TABLE global_settings 
ADD COLUMN IF NOT EXISTS timed_redirect_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timed_redirect_delay INTEGER DEFAULT 5;

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_timed_redirect_urls_user_id ON timed_redirect_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_timed_redirect_urls_enabled ON timed_redirect_urls(user_id, enabled);

-- 4. Disable RLS for public read access (same as redirect_urls)
ALTER TABLE timed_redirect_urls DISABLE ROW LEVEL SECURITY;

-- 5. Update get_link_page_data function to include timed redirect URLs
CREATE OR REPLACE FUNCTION get_link_page_data(p_slug TEXT)
RETURNS JSON AS $$
DECLARE
  v_link_record RECORD;
  v_result JSON;
BEGIN
  -- Get link data
  SELECT * INTO v_link_record 
  FROM links 
  WHERE slug = p_slug;
  
  IF v_link_record IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build result with all related data
  SELECT json_build_object(
    'link', row_to_json(v_link_record),
    'scripts', COALESCE((
      SELECT json_agg(s.*)
      FROM scripts s
      WHERE s.user_id = v_link_record.user_id AND s.enabled = true
    ), '[]'::json),
    'globalSettings', (
      SELECT row_to_json(gs.*)
      FROM global_settings gs
      WHERE gs.user_id = v_link_record.user_id
    ),
    'redirectUrls', COALESCE((
      SELECT json_agg(ru.url)
      FROM redirect_urls ru
      WHERE ru.user_id = v_link_record.user_id AND ru.enabled = true
    ), '[]'::json),
    'timedRedirectUrls', COALESCE((
      SELECT json_agg(tru.url)
      FROM timed_redirect_urls tru
      WHERE tru.user_id = v_link_record.user_id AND tru.enabled = true
    ), '[]'::json)
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
