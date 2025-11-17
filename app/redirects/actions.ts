'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function createRedirectUrlAction(userId: string, url: string) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('redirect_urls')
      .insert({
        user_id: userId,
        url: url,
        enabled: true,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/redirects');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Có lỗi xảy ra' };
  }
}

export async function toggleRedirectUrlAction(urlId: string, enabled: boolean) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('redirect_urls')
      .update({ enabled })
      .eq('id', urlId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/redirects');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Có lỗi xảy ra' };
  }
}

export async function deleteRedirectUrlAction(urlId: string) {
  try {
    await requireAuth();
    const supabase = await createClient();

    await supabase
      .from('redirect_urls')
      .delete()
      .eq('id', urlId);

    revalidatePath('/redirects');
  } catch (error) {
    console.error('Error deleting redirect URL:', error);
  }
}

