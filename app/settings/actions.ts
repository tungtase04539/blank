'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { purgeEverything } from '@/lib/cloudflare-purge';

interface SaveGlobalSettingsData {
  userId: string;
  telegramUrl: string | null;
  webUrl: string | null;
}

export async function saveGlobalSettingsAction(data: SaveGlobalSettingsData) {
  try {
    await requireAuth();
    const supabase = createAdminClient();

    // Check if settings exist
    const { data: existing } = await supabase
      .from('global_settings')
      .select('id')
      .eq('user_id', data.userId)
      .single();

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('global_settings')
        .update({
          telegram_url: data.telegramUrl,
          web_url: data.webUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', data.userId);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new settings
      const { error } = await supabase
        .from('global_settings')
        .insert({
          user_id: data.userId,
          telegram_url: data.telegramUrl,
          web_url: data.webUrl,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath('/settings');
    await purgeEverything(); // đổi settings chung → xóa cache mọi slug
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

