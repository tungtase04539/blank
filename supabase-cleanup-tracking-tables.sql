-- Remove all tracking tables (using Google Analytics instead)
-- This will free up significant database storage

-- Drop link_visits table
DROP TABLE IF EXISTS public.link_visits CASCADE;
DROP INDEX IF EXISTS idx_link_visits_link_id;
DROP INDEX IF EXISTS idx_link_visits_visited_at;

-- Drop online_sessions table  
DROP TABLE IF EXISTS public.online_sessions CASCADE;
DROP INDEX IF EXISTS idx_online_sessions_link_id;
DROP INDEX IF EXISTS idx_online_sessions_last_active;

-- Drop redirect_history table (already removed in previous migration)
DROP TABLE IF EXISTS public.redirect_history CASCADE;
DROP INDEX IF EXISTS idx_redirect_history_ip_address;
DROP INDEX IF EXISTS idx_redirect_history_expires_at;

-- Keep these tables (still needed):
-- ✅ users (authentication)
-- ✅ links (core feature)
-- ✅ scripts (script injection)
-- ✅ redirect_urls (random redirect URLs)
-- ✅ global_settings (button settings)

-- Note: Button clicks (telegram_clicks, web_clicks) are kept in links table
-- They use simple counter increment, very lightweight

