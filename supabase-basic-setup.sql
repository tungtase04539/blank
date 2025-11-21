-- =====================================================
-- BASIC SETUP SQL FOR STABLE VERSION
-- Đảm bảo database có đủ tables và functions cơ bản
-- Safe to run multiple times
-- =====================================================

-- =====================================================
-- 1. Create daily_link_views table (nếu chưa có)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_link_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(link_id, date)
);

-- =====================================================
-- 2. Update online_sessions table structure
-- =====================================================

-- Check if old structure exists and update
DO $$
BEGIN
  -- Add session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'online_sessions' AND column_name = 'session_id'
  ) THEN
    -- Drop old table and recreate with new structure
    DROP TABLE IF EXISTS public.online_sessions CASCADE;
    
    CREATE TABLE public.online_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(link_id, session_id)
    );
  END IF;
END $$;

-- =====================================================
-- 3. Create basic tracking functions
-- =====================================================

-- Function: Increment daily views
CREATE OR REPLACE FUNCTION increment_daily_views(
  p_link_id UUID,
  p_date DATE
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO daily_link_views (link_id, date, views)
  VALUES (p_link_id, p_date, 1)
  ON CONFLICT (link_id, date) 
  DO UPDATE SET 
    views = daily_link_views.views + 1,
    updated_at = NOW();
END;
$$;

-- Function: Update online session
CREATE OR REPLACE FUNCTION update_online_session(
  p_link_id UUID,
  p_session_id TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO online_sessions (link_id, session_id, updated_at)
  VALUES (p_link_id, p_session_id, NOW())
  ON CONFLICT (link_id, session_id) 
  DO UPDATE SET updated_at = NOW();
END;
$$;

-- Function: Get online count
CREATE OR REPLACE FUNCTION get_online_count(p_link_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT session_id)::INTEGER
  FROM online_sessions
  WHERE link_id = p_link_id
    AND updated_at > NOW() - INTERVAL '30 minutes';
$$;

-- Function: Get total online count
CREATE OR REPLACE FUNCTION get_total_online_count()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(DISTINCT session_id)::INTEGER
  FROM online_sessions
  WHERE updated_at > NOW() - INTERVAL '30 minutes';
$$;

-- Function: Cleanup old sessions
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE sql
AS $$
  DELETE FROM online_sessions
  WHERE updated_at < NOW() - INTERVAL '1 hour';
$$;

-- =====================================================
-- 4. Create basic indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_daily_link_views_link_id 
  ON daily_link_views(link_id);

CREATE INDEX IF NOT EXISTS idx_daily_link_views_date 
  ON daily_link_views(date);

CREATE INDEX IF NOT EXISTS idx_online_sessions_link_id 
  ON online_sessions(link_id);

CREATE INDEX IF NOT EXISTS idx_online_sessions_updated_at 
  ON online_sessions(updated_at);

-- =====================================================
-- 5. Create views for dashboard
-- =====================================================

-- View: Link stats
CREATE OR REPLACE VIEW link_stats AS
SELECT 
  l.id,
  l.user_id,
  l.slug,
  l.video_url,
  l.created_at,
  COALESCE(SUM(dlv.views), 0) as total_views,
  COALESCE(
    (SELECT COUNT(DISTINCT session_id)
     FROM online_sessions os
     WHERE os.link_id = l.id
       AND os.updated_at > NOW() - INTERVAL '30 minutes'),
    0
  ) as online_count
FROM links l
LEFT JOIN daily_link_views dlv ON l.id = dlv.link_id
GROUP BY l.id, l.user_id, l.slug, l.video_url, l.created_at;

-- View: Last 7 days stats
CREATE OR REPLACE VIEW last_7_days_stats AS
SELECT 
  date,
  SUM(views) as total_views
FROM daily_link_views
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY date
ORDER BY date;

-- =====================================================
-- 6. Enable RLS policies (if not exist)
-- =====================================================

ALTER TABLE IF EXISTS public.daily_link_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.online_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for daily_link_views
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_link_views' 
    AND policyname = 'Anyone can insert daily views'
  ) THEN
    CREATE POLICY "Anyone can insert daily views" ON public.daily_link_views
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_link_views' 
    AND policyname = 'Anyone can update daily views'
  ) THEN
    CREATE POLICY "Anyone can update daily views" ON public.daily_link_views
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'daily_link_views' 
    AND policyname = 'Users can view daily views'
  ) THEN
    CREATE POLICY "Users can view daily views" ON public.daily_link_views
      FOR SELECT USING (true);
  END IF;
END $$;

-- Policies for online_sessions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'online_sessions' 
    AND policyname = 'Anyone can insert online sessions'
  ) THEN
    CREATE POLICY "Anyone can insert online sessions" ON public.online_sessions
      FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'online_sessions' 
    AND policyname = 'Anyone can update online sessions'
  ) THEN
    CREATE POLICY "Anyone can update online sessions" ON public.online_sessions
      FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'online_sessions' 
    AND policyname = 'Users can view online sessions'
  ) THEN
    CREATE POLICY "Users can view online sessions" ON public.online_sessions
      FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'online_sessions' 
    AND policyname = 'Anyone can delete old sessions'
  ) THEN
    CREATE POLICY "Anyone can delete old sessions" ON public.online_sessions
      FOR DELETE USING (true);
  END IF;
END $$;

-- =====================================================
-- 7. Verify setup
-- =====================================================

-- Check tables
SELECT 
  'daily_link_views' as table_name,
  EXISTS(SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'daily_link_views') as exists
UNION ALL
SELECT 
  'online_sessions',
  EXISTS(SELECT 1 FROM information_schema.tables 
         WHERE table_name = 'online_sessions');

-- Check functions
SELECT 
  routine_name,
  'exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'increment_daily_views',
    'update_online_session',
    'get_online_count',
    'get_total_online_count',
    'cleanup_old_sessions'
  )
ORDER BY routine_name;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Basic setup complete!';
  RAISE NOTICE '📊 Tables: daily_link_views, online_sessions';
  RAISE NOTICE '🔧 Functions: 5 tracking functions';
  RAISE NOTICE '📈 Views: link_stats, last_7_days_stats';
  RAISE NOTICE '🔒 RLS: Enabled with policies';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Your system is ready to use!';
END $$;

