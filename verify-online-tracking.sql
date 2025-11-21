-- =====================================================
-- VERIFY ONLINE TRACKING STATUS
-- Chạy script này để kiểm tra online tracking có hoạt động
-- =====================================================

-- 1. Kiểm tra bảng online_sessions có tồn tại không
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'online_sessions'
    ) 
    THEN '✅ Table online_sessions TỒN TẠI'
    ELSE '❌ Table online_sessions KHÔNG TỒN TẠI - Cần chạy supabase-basic-setup.sql'
  END as table_status;

-- 2. Kiểm tra cấu trúc bảng
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'online_sessions'
ORDER BY ordinal_position;

-- 3. Kiểm tra có dữ liệu trong 30 phút gần nhất không
SELECT 
  COUNT(*) as total_sessions,
  COUNT(DISTINCT link_id) as unique_links,
  COUNT(DISTINCT session_id) as unique_sessions,
  MAX(updated_at) as last_update,
  CASE 
    WHEN MAX(updated_at) > NOW() - INTERVAL '30 minutes' 
    THEN '✅ CÓ dữ liệu mới (< 30 phút)'
    ELSE '⚠️ KHÔNG CÓ dữ liệu mới (> 30 phút) - Tracking có thể không hoạt động'
  END as data_status
FROM online_sessions;

-- 4. Kiểm tra 10 sessions gần nhất
SELECT 
  link_id,
  session_id,
  updated_at,
  NOW() - updated_at as age
FROM online_sessions
ORDER BY updated_at DESC
LIMIT 10;

-- 5. Kiểm tra functions có tồn tại không
SELECT 
  routine_name,
  '✅ EXISTS' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'update_online_session',
    'get_online_count',
    'get_total_online_count'
  )
ORDER BY routine_name;

-- 6. Test function get_total_online_count
SELECT 
  get_total_online_count() as current_online_count,
  CASE 
    WHEN get_total_online_count() > 0 
    THEN '✅ CÓ user online'
    ELSE '⚠️ KHÔNG CÓ user online'
  END as online_status;

-- 7. Kiểm tra RLS policies
SELECT 
  policyname,
  '✅ EXISTS' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'online_sessions'
ORDER BY policyname;

-- 8. Tổng hợp kết quả
DO $$
DECLARE
  v_table_exists BOOLEAN;
  v_has_data BOOLEAN;
  v_has_recent_data BOOLEAN;
  v_function_count INTEGER;
  v_online_count INTEGER;
BEGIN
  -- Check table
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'online_sessions'
  ) INTO v_table_exists;
  
  -- Check data
  IF v_table_exists THEN
    SELECT COUNT(*) > 0 INTO v_has_data FROM online_sessions;
    SELECT COUNT(*) > 0 INTO v_has_recent_data 
    FROM online_sessions 
    WHERE updated_at > NOW() - INTERVAL '30 minutes';
    
    SELECT get_total_online_count() INTO v_online_count;
  END IF;
  
  -- Check functions
  SELECT COUNT(*) INTO v_function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name IN (
      'update_online_session',
      'get_online_count',
      'get_total_online_count'
    );
  
  -- Report
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '📊 ONLINE TRACKING STATUS REPORT';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  
  IF v_table_exists THEN
    RAISE NOTICE '✅ Table online_sessions: TỒN TẠI';
  ELSE
    RAISE NOTICE '❌ Table online_sessions: KHÔNG TỒN TẠI';
    RAISE NOTICE '   → Cần chạy: supabase-basic-setup.sql';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Functions: % / 3', v_function_count;
  IF v_function_count = 3 THEN
    RAISE NOTICE '   ✅ update_online_session';
    RAISE NOTICE '   ✅ get_online_count';
    RAISE NOTICE '   ✅ get_total_online_count';
  ELSE
    RAISE NOTICE '   ❌ Thiếu functions - Cần chạy: supabase-basic-setup.sql';
  END IF;
  
  IF v_table_exists THEN
    RAISE NOTICE '';
    IF v_has_data THEN
      RAISE NOTICE '📊 Data: CÓ dữ liệu trong bảng';
      IF v_has_recent_data THEN
        RAISE NOTICE '   ✅ Có session mới trong 30 phút gần đây';
        RAISE NOTICE '   👥 Online hiện tại: % users', v_online_count;
      ELSE
        RAISE NOTICE '   ⚠️ KHÔNG CÓ session mới (> 30 phút)';
        RAISE NOTICE '   → Tracking có thể không hoạt động';
        RAISE NOTICE '   → Mở một link để test: /<slug>';
      END IF;
    ELSE
      RAISE NOTICE '⚠️ Data: KHÔNG CÓ dữ liệu';
      RAISE NOTICE '   → Chưa có ai truy cập link';
      RAISE NOTICE '   → Mở một link để test: /<slug>';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  
  IF v_table_exists AND v_function_count = 3 AND v_has_recent_data THEN
    RAISE NOTICE '✅ ONLINE TRACKING ĐANG HOẠT ĐỘNG BÌN THƯỜNG!';
  ELSIF v_table_exists AND v_function_count = 3 THEN
    RAISE NOTICE '⚠️ TRACKING SETUP OK NHƯNG CHƯA CÓ DATA';
    RAISE NOTICE '   → Mở link để kiểm tra: /<slug>';
  ELSE
    RAISE NOTICE '❌ ONLINE TRACKING CHƯA HOẠT ĐỘNG';
    RAISE NOTICE '   → Chạy: supabase-basic-setup.sql';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;

