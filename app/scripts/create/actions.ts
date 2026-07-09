'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { purgeEverything } from '@/lib/cloudflare-purge';

interface CreateScriptData {
  userId: string;
  location: 'head' | 'body';
  content: string;
  enabled: boolean;
}

export async function createScriptAction(data: CreateScriptData) {
  try {
    const user = await requireAuth();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        location: data.location,
        content: data.content,
        enabled: data.enabled,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/scripts');
    await purgeEverything();
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}
