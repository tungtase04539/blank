-- ============================================
-- 🍀 LUCKY REDIRECT - GLOBAL SETTINGS
-- ============================================
-- Add global lucky redirect settings (applies to ALL links)

-- First, remove old per-link columns if they exist
ALTER TABLE public.links 
DROP COLUMN IF EXISTS lucky_enabled,
DROP COLUMN IF EXISTS lucky_percentage,
DROP COLUMN IF EXISTS lucky_type;

-- Add lucky settings to global_settings table
ALTER TABLE public.global_settings 
ADD COLUMN IF NOT EXISTS lucky_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lucky_percentage INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lucky_type TEXT DEFAULT 'random';

-- Add comments
COMMENT ON COLUMN public.global_settings.lucky_enabled IS 'Enable lucky redirect for ALL links - randomly redirect users to offer page';
COMMENT ON COLUMN public.global_settings.lucky_percentage IS 'Global percentage chance to redirect (0-100). Applies to all links.';
COMMENT ON COLUMN public.global_settings.lucky_type IS 'Type of redirect: "random" (new chance each visit) or "daily" (consistent per day)';

-- Add check constraint
ALTER TABLE public.global_settings 
ADD CONSTRAINT lucky_percentage_range 
CHECK (lucky_percentage >= 0 AND lucky_percentage <= 100);

-- ============================================
-- 🎯 USAGE EXAMPLE
-- ============================================
-- Enable 10% lucky redirect for ALL links:
-- UPDATE public.global_settings 
-- SET lucky_enabled = TRUE, 
--     lucky_percentage = 10, 
--     lucky_type = 'daily'
-- WHERE user_id = 'your-user-id';
-- ============================================

SELECT '🍀 Lucky Redirect global settings added! Applies to ALL links.' AS status;

