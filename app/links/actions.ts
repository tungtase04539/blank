'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function deleteLinkAction(linkId: string) {
  const user = await requireAuth();
  const supabase = await createClient();
  
  // Lấy slug trước khi xóa để revalidate
  const { data: link } = await supabase
    .from('links')
    .select('slug')
    .eq('id', linkId)
    .single();
  
  await supabase
    .from('links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);
  
  revalidatePath('/links');
  
  // Revalidate public page
  if (link?.slug) {
    revalidatePath(`/${link.slug}`);
  }
}

export async function toggleRedirectAction(linkId: string, enabled: boolean) {
  const user = await requireAuth();
  const supabase = await createClient();
  
  // Lấy slug để revalidate
  const { data: link } = await supabase
    .from('links')
    .select('slug')
    .eq('id', linkId)
    .single();
  
  await supabase
    .from('links')
    .update({ redirect_enabled: enabled })
    .eq('id', linkId)
    .eq('user_id', user.id);
  
  revalidatePath('/links');
  
  // Revalidate public page
  if (link?.slug) {
    revalidatePath(`/${link.slug}`);
  }
}
