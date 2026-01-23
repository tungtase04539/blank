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
    
    console.log(`Creating ${totalLinks} links...`);
    
    // ✅ Generate slugs với UUID-like approach để tránh trùng
    const baseTimestamp = Date.now();
    const sessionRandom = Math.random().toString(36).substring(2, 5); // Session prefix
    
    const linksToCreate = data.videoUrls.map((videoUrl, index) => {
      // Session random (3) + index (2) + timestamp (3) + mp4
      const indexChars = index.toString(36).padStart(2, '0');
      const timeChars = ((baseTimestamp + index * 7) % 46656).toString(36).padStart(3, '0');
      const slug = `${sessionRandom}${indexChars}${timeChars}mp4`;
      
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

    console.log('Sample slugs:', linksToCreate.slice(0, 3).map(l => l.slug));
    
    // ✅ Check for duplicate slugs in batch
    const slugSet = new Set(linksToCreate.map(l => l.slug));
    if (slugSet.size !== linksToCreate.length) {
      console.error('Duplicate slugs detected in batch!');
      return { success: false, error: 'Internal error: duplicate slugs generated' };
    }

    // ✅ Insert trực tiếp
    const { data: insertedData, error } = await supabase
      .from('links')
      .insert(linksToCreate)
      .select('slug');

    if (error) {
      console.error('Insert error:', error);
      
      // Nếu có conflict, retry với timestamp mới
      if (error.code === '23505') {
        console.log('Slug conflict with existing data, retrying...');
        
        const newTimestamp = Date.now();
        const retryLinks = data.videoUrls.map((videoUrl, index) => {
          const indexChars = index.toString(36).padStart(2, '0');
          const timeChars = ((newTimestamp + index * 13) % 46656).toString(36).padStart(3, '0');
          const newRandom = Math.random().toString(36).substring(2, 5);
          const slug = `${newRandom}${indexChars}${timeChars}mp4`;
          
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
        
        const { data: retryData, error: retryError } = await supabase
          .from('links')
          .insert(retryLinks)
          .select('slug');
        
        if (retryError) {
          console.error('Retry error:', retryError);
          return { success: false, error: `Failed to create links: ${retryError.message}` };
        }
        
        console.log(`Successfully created ${retryData?.length || 0} links on retry`);
        
        revalidatePath('/links');
        for (const link of retryLinks) {
          revalidatePath(`/${link.slug}`);
        }
        
        return { 
          success: true, 
          count: retryData?.length || 0,
          slugs: retryLinks.map(link => link.slug),
          message: `Created ${retryData?.length || 0} links successfully`,
          failedCount: 0
        };
      }
      
      return { success: false, error: `Failed to create links: ${error.message}` };
    }

    const createdCount = insertedData?.length || 0;
    console.log(`Successfully created ${createdCount}/${totalLinks} links`);

    revalidatePath('/links');
    for (const link of linksToCreate) {
      revalidatePath(`/${link.slug}`);
    }
    
    return { 
      success: true, 
      count: createdCount,
      slugs: linksToCreate.map(link => link.slug),
      message: `Created ${createdCount} links successfully`,
      failedCount: totalLinks - createdCount
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: `An error occurred: ${error}` };
  }
}

