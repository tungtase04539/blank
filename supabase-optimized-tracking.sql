-- 🚀 OPTIMIZED TRACKING SYSTEM FOR SUPABASE FREE TIER
-- Designed for 500K+ daily traffic with minimal API calls

-- ============================================
-- 1. ENSURE REQUIRED TABLES EXIST
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

-- Create redirect_urls table if not exists (for random redirect)
CREATE TABLE IF NOT EXISTS public.redirect_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. DROP OLD TRACKING TABLES (Clean slate)
-- ============================================

-- Drop button click columns (not needed anymore)
ALTER TABLE links 
  DROP COLUMN IF EXISTS telegram_clicks,
  DROP COLUMN IF EXISTS web_clicks;

-- Drop old tracking tables if they exist
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS online_sessions CASCADE;

-- ============================================
-- 3. DAILY STATS TABLE (Aggregate data)
-- ============================================

-- Instead of storing each view, we aggregate by day
-- This reduces storage by 99% and makes queries super fast!

CREATE TABLE daily_stats (
  id BIGSERIAL PRIMARY KEY,
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  unique_sessions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(link_id, date)
);

CREATE INDEX idx_daily_stats_link_date ON daily_stats(link_id, date DESC);
CREATE INDEX idx_daily_stats_date ON daily_stats(date DESC);

-- ============================================
-- 4. ONLINE SESSIONS TABLE (Real-time)
-- ============================================

-- Track active sessions (30 min timeout)
-- Much lighter than tracking every pageview!

CREATE TABLE online_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL, -- Client-generated UUID
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(session_id, link_id)
);

CREATE INDEX idx_online_sessions_link_id ON online_sessions(link_id);
CREATE INDEX idx_online_sessions_last_active ON online_sessions(last_active DESC);

-- ============================================
-- 5. DATABASE FUNCTIONS (Reduce API calls)
-- ============================================

-- Function 1: Increment daily views
-- This does INSERT or UPDATE in ONE database call!
CREATE OR REPLACE FUNCTION increment_daily_views(
  p_link_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (link_id, date, view_count)
  VALUES (p_link_id, p_date, 1)
  ON CONFLICT (link_id, date)
  DO UPDATE SET 
    view_count = daily_stats.view_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Update online session
-- Upsert session with last_active timestamp
CREATE OR REPLACE FUNCTION update_online_session(
  p_link_id UUID,
  p_session_id TEXT
)
RETURNS void AS $$
BEGIN
  INSERT INTO online_sessions (link_id, session_id, last_active)
  VALUES (p_link_id, p_session_id, NOW())
  ON CONFLICT (session_id, link_id)
  DO UPDATE SET 
    last_active = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 3: Get online count for link
-- Only counts sessions active in last 30 minutes
CREATE OR REPLACE FUNCTION get_online_count(p_link_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM online_sessions
    WHERE link_id = p_link_id
      AND last_active > NOW() - INTERVAL '30 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 4: Get total online count (all links)
CREATE OR REPLACE FUNCTION get_total_online_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM online_sessions
    WHERE last_active > NOW() - INTERVAL '30 minutes'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 5: Cleanup old sessions (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  -- Delete sessions inactive for 30+ minutes
  DELETE FROM online_sessions
  WHERE last_active < NOW() - INTERVAL '30 minutes';
  
  -- Delete daily stats older than 90 days
  DELETE FROM daily_stats
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role (API) to do everything
CREATE POLICY "Service role full access - daily_stats" 
  ON daily_stats FOR ALL 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role full access - online_sessions" 
  ON online_sessions FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Users can read their own link stats
CREATE POLICY "Users can read own stats" 
  ON daily_stats FOR SELECT 
  USING (
    link_id IN (
      SELECT id FROM links WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own sessions" 
  ON online_sessions FOR SELECT 
  USING (
    link_id IN (
      SELECT id FROM links WHERE user_id = auth.uid()
    )
  );

-- Enable RLS for global_settings and redirect_urls
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE redirect_urls ENABLE ROW LEVEL SECURITY;

-- Policies for global_settings
CREATE POLICY "Users can manage their own settings" 
  ON global_settings FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- Policies for redirect_urls
CREATE POLICY "Users can manage their own redirect URLs" 
  ON redirect_urls FOR ALL 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 7. HELPFUL VIEWS
-- ============================================

-- View: Link stats with online count
CREATE OR REPLACE VIEW link_stats AS
SELECT 
  l.id,
  l.slug,
  l.video_url,
  l.user_id,
  COALESCE(SUM(ds.view_count), 0)::INTEGER as total_views,
  COALESCE(
    (SELECT COUNT(*) 
     FROM online_sessions os 
     WHERE os.link_id = l.id 
       AND os.last_active > NOW() - INTERVAL '30 minutes'
    ), 0
  )::INTEGER as online_count,
  l.created_at
FROM links l
LEFT JOIN daily_stats ds ON ds.link_id = l.id
GROUP BY l.id, l.slug, l.video_url, l.user_id, l.created_at;

-- View: Last 7 days stats (for dashboard chart)
CREATE OR REPLACE VIEW last_7_days_stats AS
SELECT 
  date,
  SUM(view_count) as total_views
FROM daily_stats
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date DESC;

-- ============================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================

-- Already created above, but listing for reference:
-- - idx_daily_stats_link_date (link_id, date)
-- - idx_daily_stats_date (date)
-- - idx_online_sessions_link_id (link_id)
-- - idx_online_sessions_last_active (last_active)

-- Indexes for global_settings and redirect_urls
CREATE INDEX IF NOT EXISTS idx_global_settings_user_id ON global_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_redirect_urls_user_id ON redirect_urls(user_id);
CREATE INDEX IF NOT EXISTS idx_redirect_urls_enabled ON redirect_urls(enabled);

-- ============================================
-- 9. TEST DATA (Optional - for development)
-- ============================================

-- Uncomment to add test data
/*
-- Add some test views
INSERT INTO daily_stats (link_id, date, view_count)
SELECT 
  id,
  CURRENT_DATE - (n || ' days')::INTERVAL,
  (random() * 1000)::INTEGER
FROM links, generate_series(0, 6) n;
*/

-- ============================================
-- 10. MAINTENANCE SCHEDULE
-- ============================================

-- Run cleanup daily via Supabase Edge Function or pg_cron
-- SELECT cleanup_old_sessions();

-- ============================================
-- DONE! 🎉
-- ============================================

-- Verify tables
SELECT 
  'daily_stats' as table_name, 
  COUNT(*) as row_count 
FROM daily_stats
UNION ALL
SELECT 
  'online_sessions' as table_name, 
  COUNT(*) as row_count 
FROM online_sessions;

-- Verify functions exist
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%daily%'
     OR routine_name LIKE '%online%'
     OR routine_name LIKE '%cleanup%';

