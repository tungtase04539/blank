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
    return { success: false, error: 'An error occurred' };
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
    return { success: false, error: 'An error occurred' };
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

export async function updateGlobalLuckySettingsAction(
  userId: string,
  settings: { luckyEnabled: boolean; luckyPercentage: number; luckyType: 'random' | 'daily' }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    // Use UPSERT to support both new accounts (INSERT) and existing accounts (UPDATE)
    const { error } = await supabase
      .from('global_settings')
      .upsert({
        user_id: user.id,
        lucky_enabled: settings.luckyEnabled,
        lucky_percentage: settings.luckyPercentage,
        lucky_type: settings.luckyType,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',  // If user_id already exists, update instead of insert
        ignoreDuplicates: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/redirects');
    revalidatePath('/[slug]', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

// =============================================
// ⏱️ TIMED REDIRECT (5s) ACTIONS
// =============================================

export async function createTimedRedirectUrlAction(userId: string, url: string) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('timed_redirect_urls')
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
    return { success: false, error: 'An error occurred' };
  }
}

export async function toggleTimedRedirectUrlAction(urlId: string, enabled: boolean) {
  try {
    await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('timed_redirect_urls')
      .update({ enabled })
      .eq('id', urlId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/redirects');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

export async function deleteTimedRedirectUrlAction(urlId: string) {
  try {
    await requireAuth();
    const supabase = await createClient();

    await supabase
      .from('timed_redirect_urls')
      .delete()
      .eq('id', urlId);

    revalidatePath('/redirects');
  } catch (error) {
    console.error('Error deleting timed redirect URL:', error);
  }
}

export async function updateTimedRedirectSettingsAction(
  userId: string,
  settings: { timedRedirectEnabled: boolean; timedRedirectDelay: number }
) {
  try {
    const user = await requireAuth();
    const supabase = await createClient();

    const { error } = await supabase
      .from('global_settings')
      .upsert({
        user_id: user.id,
        timed_redirect_enabled: settings.timedRedirectEnabled,
        timed_redirect_delay: settings.timedRedirectDelay,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/redirects');
    revalidatePath('/[slug]', 'page');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

