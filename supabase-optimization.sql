-- =====================================================
-- SUPABASE OPTIMIZATION: Gộp 4 queries → 1
-- Chạy file này trong Supabase Dashboard > SQL Editor
-- =====================================================

-- Function lấy tất cả data cho public link page trong 1 query
CREATE OR REPLACE FUNCTION get_link_page_data(p_slug TEXT)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_link RECORD;
  v_result JSON;
BEGIN
  -- Lấy link
  SELECT * INTO v_link FROM links WHERE slug = p_slug;
  
  IF v_link IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Build JSON với tất cả data
  SELECT json_build_object(
    'link', row_to_json(v_link),
    'scripts', COALESCE(
      (SELECT json_agg(row_to_json(s) ORDER BY s.created_at) 
       FROM scripts s 
       WHERE s.user_id = v_link.user_id AND s.enabled = true),
      '[]'::json
    ),
    'globalSettings', (
      SELECT row_to_json(g) 
      FROM global_settings g 
      WHERE g.user_id = v_link.user_id
    ),
    'redirectUrls', COALESCE(
      (SELECT json_agg(r.url) 
       FROM redirect_urls r 
       WHERE r.user_id = v_link.user_id AND r.enabled = true),
      '[]'::json
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Grant permission
GRANT EXECUTE ON FUNCTION get_link_page_data(TEXT) TO anon, authenticated;

-- =====================================================
-- TEST: Chạy query này để verify function hoạt động
-- SELECT get_link_page_data('kmkg8mp4');
-- =====================================================
