-- Add button click tracking columns to links table
ALTER TABLE public.links 
ADD COLUMN IF NOT EXISTS telegram_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS web_clicks INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_links_telegram_clicks ON public.links(telegram_clicks);
CREATE INDEX IF NOT EXISTS idx_links_web_clicks ON public.links(web_clicks);

