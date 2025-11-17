'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface SaveGlobalSettingsData {
  userId: string;
  telegramUrl: string | null;
  webUrl: string | null;
}

export async function saveGlobalSettingsAction(data: SaveGlobalSettingsData) {
  try {
    await requireAuth();
    const supabase = await createClient();

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
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

