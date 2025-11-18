-- ============================================
-- FIX RLS POLICIES FOR GLOBAL_SETTINGS & REDIRECT_URLS
-- ============================================
-- Problem: Policies block service role from inserting
-- Solution: Allow service role full access + user-specific policies

-- ============================================
-- 1. DROP OLD POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can manage their own settings" ON global_settings;
DROP POLICY IF EXISTS "Users can manage their own redirect URLs" ON redirect_urls;

-- ============================================
-- 2. CREATE NEW POLICIES (Allow service role)
-- ============================================

-- Global Settings Policies
CREATE POLICY "Enable all for service role - global_settings"
  ON global_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own settings"
  ON global_settings
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON global_settings
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON global_settings
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own settings"
  ON global_settings
  FOR DELETE
  USING (user_id = auth.uid());

-- Redirect URLs Policies
CREATE POLICY "Enable all for service role - redirect_urls"
  ON redirect_urls
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can read own redirect URLs"
  ON redirect_urls
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own redirect URLs"
  ON redirect_urls
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own redirect URLs"
  ON redirect_urls
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own redirect URLs"
  ON redirect_urls
  FOR DELETE
  USING (user_id = auth.uid());

-- ============================================
-- 3. VERIFY POLICIES
-- ============================================

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('global_settings', 'redirect_urls')
ORDER BY tablename, policyname;

-- ============================================
-- DONE! 🎉
-- ============================================

