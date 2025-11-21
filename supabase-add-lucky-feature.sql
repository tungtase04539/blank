-- ============================================
-- 🍀 LUCKY REDIRECT FEATURE
-- ============================================
-- Add lucky redirect settings to links table
-- Allows configurable percentage-based instant redirect

-- Add columns to links table
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS lucky_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS lucky_percentage INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lucky_type TEXT DEFAULT 'random';

-- Add comments for documentation
COMMENT ON COLUMN public.links.lucky_enabled IS 'Enable lucky redirect feature - randomly redirect users to offer page';
COMMENT ON COLUMN public.links.lucky_percentage IS 'Percentage chance to redirect (0-100). E.g., 10 = 10% of users get redirected';
COMMENT ON COLUMN public.links.lucky_type IS 'Type of redirect: "random" (new chance each visit) or "daily" (consistent per day)';

-- Add check constraint to ensure percentage is valid
ALTER TABLE public.links 
ADD CONSTRAINT lucky_percentage_range 
CHECK (lucky_percentage >= 0 AND lucky_percentage <= 100);

-- Create index for performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_links_lucky_enabled ON public.links(lucky_enabled) WHERE lucky_enabled = TRUE;

-- ============================================
-- 🎯 USAGE EXAMPLES
-- ============================================
-- 
-- Example 1: Enable 10% random redirect for a link
-- UPDATE public.links 
-- SET lucky_enabled = TRUE, 
--     lucky_percentage = 10, 
--     lucky_type = 'random' 
-- WHERE slug = 'your-slug';
--
-- Example 2: Enable 50% daily consistent redirect
-- UPDATE public.links 
-- SET lucky_enabled = TRUE, 
--     lucky_percentage = 50, 
--     lucky_type = 'daily' 
-- WHERE slug = 'your-slug';
--
-- Example 3: Disable lucky redirect
-- UPDATE public.links 
-- SET lucky_enabled = FALSE 
-- WHERE slug = 'your-slug';
--
-- ============================================

SELECT 'Lucky Redirect feature columns added successfully! ✅' AS status;

