export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Link {
  id: string;
  user_id: string;
  slug: string;
  video_url: string;
  destination_url: string | null;
  redirect_enabled: boolean;
  telegram_url: string | null;
  web_url: string | null;
  lucky_enabled?: boolean;
  lucky_percentage?: number;
  lucky_type?: 'random' | 'daily';
  created_at: string;
  updated_at: string;
}

export interface Script {
  id: string;
  user_id: string;
  location: 'head' | 'body';
  content: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface DailyStatsDB {
  id: number;
  link_id: string;
  date: string;
  view_count: number;
  unique_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface OnlineSession {
  id: string;
  link_id: string;
  session_id: string;
  last_active: string;
  created_at: string;
}

export interface LinkStats extends Link {
  total_views: number;
  online_count: number;
}

export interface DailyStats {
  date: string;
  visits: number;
}

export interface GlobalSettings {
  id: string;
  user_id: string;
  telegram_url: string | null;
  web_url: string | null;
  created_at: string;
  updated_at: string;
}

