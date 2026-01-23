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
    
    // ✅ ZERO-CHECK APPROACH: Generate slugs với timestamp + counter = 100% unique
    const timestamp = Date.now().toString(36); // Base36 timestamp
    const randomPrefix = Math.random().toString(36).substring(2, 5); // 3 ký tự random
    
    const linksToCreate = data.videoUrls.map((videoUrl, index) => {
      // Format: {random}{timestamp}{counter}mp4
      // VD: abc1k2j3f001mp4, abc1k2j3f002mp4, ...
      const counter = index.toString(36).padStart(3, '0'); // Base36 counter
      const slug = `${randomPrefix}${timestamp}${counter}mp4`.substring(0, 15); // Giới hạn 15 ký tự
      
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

    // ✅ Insert trực tiếp - KHÔNG CẦN CHECK (timestamp + counter = unique)
    // Nếu có conflict (cực kỳ hiếm), database sẽ báo lỗi và retry
    const { error } = await supabase
      .from('links')
      .insert(linksToCreate);

    if (error) {
      // Nếu có conflict (rất hiếm), fallback về cách cũ
      if (error.code === '23505') { // Unique constraint violation
        console.log('Slug conflict detected, retrying with new timestamp...');
        
        // Retry với timestamp mới
        const newTimestamp = (Date.now() + 1).toString(36);
        const retryLinks = data.videoUrls.map((videoUrl, index) => {
          const counter = index.toString(36).padStart(3, '0');
          const slug = `${randomPrefix}${newTimestamp}${counter}mp4`.substring(0, 15);
          
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
    // Revalidate tất cả public pages mới tạo
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

