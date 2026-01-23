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
    
    // ✅ BATCH INSERT: Chia nhỏ để tránh timeout
    const BATCH_SIZE = 20; // Insert 20 links mỗi lần
    const allCreatedSlugs: string[] = [];
    let totalCreated = 0;
    
    const baseTimestamp = Date.now();
    const sessionRandom = Math.random().toString(36).substring(2, 5);
    
    // Chia thành các batches
    for (let i = 0; i < totalLinks; i += BATCH_SIZE) {
      const batchUrls = data.videoUrls.slice(i, i + BATCH_SIZE);
      const batchIndex = Math.floor(i / BATCH_SIZE);
      
      console.log(`Processing batch ${batchIndex + 1}/${Math.ceil(totalLinks / BATCH_SIZE)} (${batchUrls.length} links)`);
      
      const linksToCreate = batchUrls.map((videoUrl, idx) => {
        const globalIndex = i + idx;
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

      // Insert batch
      const { data: insertedData, error } = await supabase
        .from('links')
        .insert(linksToCreate)
        .select('slug');

      if (error) {
        console.error(`Batch ${batchIndex + 1} error:`, error);
        
        // Nếu conflict, retry batch này
        if (error.code === '23505') {
          console.log(`Retrying batch ${batchIndex + 1}...`);
          
          const retryLinks = batchUrls.map((videoUrl, idx) => {
            const globalIndex = i + idx;
            const indexChars = globalIndex.toString(36).padStart(2, '0');
            const timeChars = ((Date.now() + globalIndex * 13) % 46656).toString(36).padStart(3, '0');
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
            console.error(`Batch ${batchIndex + 1} retry failed:`, retryError);
            // Continue với batch tiếp theo thay vì fail toàn bộ
            continue;
          }
          
          const batchCreated = retryData?.length || 0;
          totalCreated += batchCreated;
          allCreatedSlugs.push(...retryLinks.map(l => l.slug));
          console.log(`Batch ${batchIndex + 1} retry success: ${batchCreated} links`);
        } else {
          // Lỗi khác, continue
          console.error(`Batch ${batchIndex + 1} failed, continuing...`);
          continue;
        }
      } else {
        const batchCreated = insertedData?.length || 0;
        totalCreated += batchCreated;
        allCreatedSlugs.push(...linksToCreate.map(l => l.slug));
        console.log(`Batch ${batchIndex + 1} success: ${batchCreated} links`);
      }
    }

    console.log(`Total created: ${totalCreated}/${totalLinks} links`);

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

