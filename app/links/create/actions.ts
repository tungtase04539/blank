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
    
    // ✅ PARALLEL BATCH INSERT: Insert nhiều batches cùng lúc
    const BATCH_SIZE = 25; // 25 links mỗi batch
    const batches: string[][] = [];
    
    // Chia thành batches
    for (let i = 0; i < totalLinks; i += BATCH_SIZE) {
      batches.push(data.videoUrls.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Split into ${batches.length} batches`);
    
    const baseTimestamp = Date.now();
    const sessionRandom = Math.random().toString(36).substring(2, 5);
    
    // Insert tất cả batches song song
    const batchPromises = batches.map(async (batchUrls, batchIndex) => {
      const startIndex = batchIndex * BATCH_SIZE;
      
      const linksToCreate = batchUrls.map((videoUrl, idx) => {
        const globalIndex = startIndex + idx;
        const indexChars = globalIndex.toString(36).padStart(2, '0');
        const timeChars = ((baseTimestamp + globalIndex * 7) % 46656).toString(36).padStart(3, '0');
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

      const { data: insertedData, error } = await supabase
        .from('links')
        .insert(linksToCreate)
        .select('slug');

      if (error) {
        console.error(`Batch ${batchIndex + 1} error:`, error.message);
        return { success: false, count: 0, slugs: [] };
      }

      console.log(`Batch ${batchIndex + 1} success: ${insertedData?.length || 0} links`);
      return { 
        success: true, 
        count: insertedData?.length || 0, 
        slugs: linksToCreate.map(l => l.slug) 
      };
    });

    // Đợi tất cả batches hoàn thành
    const results = await Promise.all(batchPromises);
    
    const totalCreated = results.reduce((sum, r) => sum + r.count, 0);
    const allCreatedSlugs = results.flatMap(r => r.slugs);

    console.log(`Total created: ${totalCreated}/${totalLinks} links`);

    // Chỉ revalidate list page
    revalidatePath('/links');
    
    return { 
      success: true, 
      count: totalCreated,
      slugs: allCreatedSlugs,
      message: totalCreated === totalLinks 
        ? `Created ${totalCreated} links successfully`
        : `Created ${totalCreated}/${totalLinks} links (${totalLinks - totalCreated} failed)`,
      failedCount: totalLinks - totalCreated
    };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: `An error occurred: ${error}` };
  }
}

