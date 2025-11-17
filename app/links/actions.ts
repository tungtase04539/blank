'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteLinkAction(linkId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  
  await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);
  
  revalidatePath('/links');
}

export async function toggleRedirectAction(linkId: string, enabled: boolean) {
  const user = await requireAuth();
  const supabase = await createClient();
  
  await supabase
    .from('links')
    .update({ redirect_enabled: enabled })
    .eq('id', linkId)
    .eq('user_id', user.id);
  
  revalidatePath('/links');
}

