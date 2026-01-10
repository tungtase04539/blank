import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client cho PUBLIC pages (không cần auth)
 * Dùng cho /[slug] - không cần cookies, không cần middleware
 */
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
