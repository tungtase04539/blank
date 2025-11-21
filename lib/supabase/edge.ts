import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Edge Runtime compatible Supabase client
 * Uses direct client without cookies (stateless)
 */
export function createClient() {
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

