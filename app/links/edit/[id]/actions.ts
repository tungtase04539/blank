'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { purgeSlugs } from '@/lib/cloudflare-purge';

interface UpdateLinkData {
  linkId: string;
  videoUrl: string;
  destinationUrl: string | null;
  redirectEnabled: boolean;
  telegramUrl: string | null;
  webUrl: string | null;
}

export async function updateLinkAction(data: UpdateLinkData) {
  try {
    const user = await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('links')
      .update({
        video_url: data.videoUrl,
        destination_url: data.destinationUrl,
        redirect_enabled: data.redirectEnabled,
        telegram_url: data.telegramUrl,
        web_url: data.webUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.linkId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Lấy slug để purge đúng trang đó trên Cloudflare
    const { data: link } = await supabase
      .from('links')
      .select('slug')
      .eq('id', data.linkId)
      .single();

    revalidatePath('/links');
    if (link?.slug) {
      revalidatePath(`/${link.slug}`);
      await purgeSlugs([link.slug]);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

