'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { purgeEverything } from '@/lib/cloudflare-purge';

export async function deleteScriptAction(scriptId: string) {
  const user = await requireAuth();
  const supabase = createAdminClient();
  
  await supabase
    .from('scripts')
    .delete()
    .eq('id', scriptId)
    .eq('user_id', user.id);
  
  revalidatePath('/scripts');
  await purgeEverything();
}

export async function toggleScriptAction(scriptId: string, enabled: boolean) {
  const user = await requireAuth();
  const supabase = createAdminClient();
  
  await supabase
    .from('scripts')
    .update({ enabled })
    .eq('id', scriptId)
    .eq('user_id', user.id);
  
  revalidatePath('/scripts');
  await purgeEverything();
}

