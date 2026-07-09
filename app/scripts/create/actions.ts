'use server';

import { createClient } from '@/lib/supabase/server';
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
    const supabase = await createClient();

    const { error } = await supabase
      .from('scripts')
      .insert({
        user_id: data.userId,
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

