'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface UpdateLinkData {
  linkId: string;
  videoUrl: string;
  destinationUrl: string | null;
  redirectEnabled: boolean;
  telegramUrl: string | null;
  webUrl: string | null;
  luckyEnabled: boolean;
  luckyPercentage: number;
  luckyType: 'random' | 'daily';
}

export async function updateLinkAction(data: UpdateLinkData) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('links')
      .update({
        video_url: data.videoUrl,
        destination_url: data.destinationUrl,
        redirect_enabled: data.redirectEnabled,
        telegram_url: data.telegramUrl,
        web_url: data.webUrl,
        lucky_enabled: data.luckyEnabled,
        lucky_percentage: data.luckyPercentage,
        lucky_type: data.luckyType,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.linkId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/links');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

