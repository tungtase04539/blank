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

export interface LinkVisit {
  id: string;
  link_id: string;
  visited_at: string;
  ip_address: string | null;
  user_agent: string | null;
  referer: string | null;
}

export interface LinkWithVisitCount extends Link {
  visit_count: number;
}

export interface DailyStats {
  date: string;
  visits: number;
}

