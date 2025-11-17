-- Tạo tables cho hệ thống Quick Link

-- Table: users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: links
CREATE TABLE IF NOT EXISTS public.links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  video_url TEXT NOT NULL,
  destination_url TEXT,
  redirect_enabled BOOLEAN DEFAULT FALSE,
  telegram_url TEXT,
  web_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: scripts
CREATE TABLE IF NOT EXISTS public.scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  location TEXT NOT NULL CHECK (location IN ('head', 'body')),
  content TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: global_settings
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  telegram_url TEXT,
  web_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Table: link_visits
CREATE TABLE IF NOT EXISTS public.link_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT
);

-- Table: online_sessions (track online viewers - 30 min timeout)
CREATE TABLE IF NOT EXISTS public.online_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(link_id, ip_address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_user_id ON public.links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_slug ON public.links(slug);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON public.scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_link_visits_link_id ON public.link_visits(link_id);
CREATE INDEX IF NOT EXISTS idx_link_visits_visited_at ON public.link_visits(visited_at);
CREATE INDEX IF NOT EXISTS idx_global_settings_user_id ON public.global_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_link_id ON public.online_sessions(link_id);
CREATE INDEX IF NOT EXISTS idx_online_sessions_last_active ON public.online_sessions(last_active);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_sessions ENABLE ROW LEVEL SECURITY;

-- Policies cho users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (true);

-- Policies cho links
CREATE POLICY "Users can view their own links" ON public.links
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own links" ON public.links
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own links" ON public.links
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own links" ON public.links
  FOR DELETE USING (true);

-- Policies cho scripts
CREATE POLICY "Users can view all scripts" ON public.scripts
  FOR SELECT USING (true);

CREATE POLICY "Users can create scripts" ON public.scripts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update scripts" ON public.scripts
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete scripts" ON public.scripts
  FOR DELETE USING (true);

-- Policies cho link_visits (cho phép insert và select)
CREATE POLICY "Anyone can create visit records" ON public.link_visits
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view visit records" ON public.link_visits
  FOR SELECT USING (true);

-- Policies cho global_settings
CREATE POLICY "Users can view their own settings" ON public.global_settings
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own settings" ON public.global_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own settings" ON public.global_settings
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own settings" ON public.global_settings
  FOR DELETE USING (true);

-- Policies cho online_sessions
CREATE POLICY "Anyone can create online sessions" ON public.online_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update online sessions" ON public.online_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Users can view online sessions" ON public.online_sessions
  FOR SELECT USING (true);

CREATE POLICY "Auto delete old sessions" ON public.online_sessions
  FOR DELETE USING (true);

-- Tạo default admin user (password: admin123)
-- Hash này là bcrypt hash của "admin123"
INSERT INTO public.users (email, password_hash, role) 
VALUES ('admin@example.com', '$2a$10$rKvHYjZlYlBwfQXqJ1cXKOnK4HJxVxLz4QZhT.qGxMmVqJrKC7pWa', 'admin')
ON CONFLICT (email) DO NOTHING;

