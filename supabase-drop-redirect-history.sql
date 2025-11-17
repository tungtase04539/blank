-- Drop redirect_history table (no longer needed with random redirect)
-- This frees up database storage

DROP TABLE IF EXISTS public.redirect_history CASCADE;

-- Drop related index if exists
DROP INDEX IF EXISTS idx_redirect_history_ip_address;
DROP INDEX IF EXISTS idx_redirect_history_expires_at;

-- Note: redirect_urls table is kept - still needed for the URL list

