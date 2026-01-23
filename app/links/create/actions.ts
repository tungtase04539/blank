'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { generateSlug } from '@/lib/utils';

interface CreateLinkData {
  userId: string;
  slug: string;
  videoUrl: string;
  destinationUrl: string | null;
  redirectEnabled: boolean;
  telegramUrl: string | null;
  webUrl: string | null;
}

interface CreateMultiLinksData {
  userId: string;
  videoUrls: string[];
  destinationUrl: string | null;
  redirectEnabled: boolean;
  telegramUrl: string | null;
  webUrl: string | null;
}

export async function createLinkAction(data: CreateLinkData) {
  try {
    const supabase = await createClient();

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('links')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return { success: false, error: 'This slug is already in use' };
    }

    // Create link
    const { error } = await supabase
      .from('links')
      .insert({
        user_id: data.userId,
        slug: data.slug,
        video_url: data.videoUrl,
        destination_url: data.destinationUrl,
        redirect_enabled: data.redirectEnabled,
        telegram_url: data.telegramUrl,
        web_url: data.webUrl,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/links');
    // Revalidate public page mới tạo
    revalidatePath(`/${data.slug}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

export async function createMultiLinksAction(data: CreateMultiLinksData) {
  try {
    const supabase = await createClient();
    const totalLinks = data.videoUrls.length;
    
    // ✅ ZERO-CHECK: Generate slugs ngắn gọn với timestamp + random
    const baseTimestamp = Date.now();
    
    const linksToCreate = data.videoUrls.map((videoUrl, index) => {
      // Random 5 ký tự + 3 ký tự từ timestamp
      const random5 = Math.random().toString(36).substring(2, 7); // 5 chars
      const timeChars = ((baseTimestamp + index) % 46656).toString(36).padStart(3, '0'); // 3 chars (0-zzz)
      const slug = `${random5}${timeChars}mp4`; // Total: 8 chars + mp4 = 11 chars
      
      return {
        user_id: data.userId,
        slug: slug,
        video_url: videoUrl,
        destination_url: data.destinationUrl,
        redirect_enabled: data.redirectEnabled,
        telegram_url: data.telegramUrl,
        web_url: data.webUrl,
      };
    });

    // ✅ Insert trực tiếp - KHÔNG CẦN CHECK
    const { error } = await supabase
      .from('links')
      .insert(linksToCreate);

    if (error) {
      // Nếu có conflict (rất hiếm), retry với random mới
      if (error.code === '23505') {
        console.log('Slug conflict detected, retrying...');
        
        const retryLinks = data.videoUrls.map((videoUrl, index) => {
          const random5 = Math.random().toString(36).substring(2, 7);
          const timeChars = ((Date.now() + index) % 46656).toString(36).padStart(3, '0');
          const slug = `${random5}${timeChars}mp4`;
          
          return {
            user_id: data.userId,
            slug: slug,
            video_url: videoUrl,
            destination_url: data.destinationUrl,
            redirect_enabled: data.redirectEnabled,
            telegram_url: data.telegramUrl,
            web_url: data.webUrl,
          };
        });
        
        const { error: retryError } = await supabase
          .from('links')
          .insert(retryLinks);
        
        if (retryError) {
          return { success: false, error: retryError.message };
        }
        
        revalidatePath('/links');
        for (const link of retryLinks) {
          revalidatePath(`/${link.slug}`);
        }
        
        return { 
          success: true, 
          count: retryLinks.length,
          slugs: retryLinks.map(link => link.slug),
          message: `Created ${retryLinks.length} links successfully`,
          failedCount: 0
        };
      }
      
      return { success: false, error: error.message };
    }

    revalidatePath('/links');
    for (const link of linksToCreate) {
      revalidatePath(`/${link.slug}`);
    }
    
    return { 
      success: true, 
      count: linksToCreate.length,
      slugs: linksToCreate.map(link => link.slug),
      message: `Created ${linksToCreate.length} links successfully`,
      failedCount: 0
    };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

