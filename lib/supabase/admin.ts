import { createClient } from '@supabase/supabase-js';

/**
 * SERVER-ONLY admin client dùng SERVICE_ROLE key → BỎ QUA RLS.
 *
 * ⚠️ TUYỆT ĐỐI không import ở client component. Chỉ gọi trong server action
 * SAU khi đã `requireAuth()` / `requireAdmin()` để kiểm tra quyền.
 *
 * Dùng cho mọi thao tác GHI (insert/update/delete). Sau khi khóa RLS (chặn anon
 * ghi), ghi qua client này vẫn chạy vì service_role bỏ qua RLS.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
