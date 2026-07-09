-- ============================================================================
-- SECURITY LOCKDOWN — chặn anon key ghi DB + chặn đọc bảng users
-- ============================================================================
-- BỐI CẢNH: app dùng anon key (công khai trong bundle) + policy cũ để (true)
-- => ai cũng chèn <script> (XSS), sửa/xóa link, đọc password_hash.
--
-- SAU FIX: mọi GHI đi qua service_role (server, sau requireAuth) — service_role
-- BỎ QUA RLS nên vẫn chạy. Anon chỉ còn ĐỌC nội dung công khai (cho trang slug),
-- KHÔNG ghi được gì, KHÔNG đọc được bảng users.
--
-- ⚠️ CHẠY SAU KHI đã deploy code mới (dùng admin client). Chạy trong
--    Supabase → SQL Editor. An toàn chạy lại nhiều lần (idempotent).
-- ============================================================================

-- 1) Xoá TẤT CẢ policy cũ trên các bảng nhạy cảm (nhiều policy để (true))
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'links','scripts','global_settings',
        'redirect_urls','timed_redirect_urls','users'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 2) Bật RLS cho tất cả (global_settings trước đây bị DISABLE)
ALTER TABLE public.links               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scripts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_urls       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timed_redirect_urls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;

-- 3) CONTENT tables: CHỈ cho ĐỌC công khai (trang slug + admin đọc).
--    KHÔNG tạo policy INSERT/UPDATE/DELETE => anon KHÔNG ghi được.
--    App ghi qua service_role (bypass RLS) nên vẫn chạy bình thường.
CREATE POLICY "public_read_links"
  ON public.links FOR SELECT USING (true);
CREATE POLICY "public_read_scripts"
  ON public.scripts FOR SELECT USING (true);
CREATE POLICY "public_read_global_settings"
  ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "public_read_redirect_urls"
  ON public.redirect_urls FOR SELECT USING (true);
CREATE POLICY "public_read_timed_redirect_urls"
  ON public.timed_redirect_urls FOR SELECT USING (true);

-- 4) USERS: KHÔNG tạo policy nào => anon KHÔNG đọc/ghi được (password_hash an toàn).
--    lib/auth đọc users qua service_role (bypass RLS) nên login vẫn chạy.
--    (không có CREATE POLICY cho public.users là cố ý)

-- ============================================================================
-- LƯU Ý: KHÔNG đụng tới các bảng tracking (link_visits, daily_link_views,
-- online_sessions...) — giữ nguyên policy của chúng.
--
-- KIỂM TRA sau khi chạy (nên trả 0 dòng cho anon ghi):
--   Đăng nhập admin → tạo/sửa/xóa link, đổi settings, thêm script → phải chạy OK.
--   Lấy anon key thử ghi trực tiếp (vd chèn scripts) → phải bị chặn (401/403).
-- ============================================================================
