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
    
    // ✅ OPTIMIZED: Generate nhiều slugs cùng lúc với timestamp để tránh trùng
    const generateUniqueSlugs = (count: number): string[] => {
      const slugs = new Set<string>();
      const timestamp = Date.now();
      
      while (slugs.size < count) {
        // Thêm timestamp vào seed để tránh trùng lặp
        const slug = generateSlug() + Math.random().toString(36).substring(2, 4);
        slugs.add(slug.substring(0, 10)); // Giới hạn độ dài
      }
      
      return Array.from(slugs);
    };

    // Generate gấp đôi số slugs cần thiết để đảm bảo đủ sau khi filter trùng
    let candidateSlugs = generateUniqueSlugs(totalLinks * 2);
    
    // ✅ Check tất cả slugs cùng lúc (1 query thay vì N queries)
    const { data: existingSlugs } = await supabase
      .from('links')
      .select('slug')
      .in('slug', candidateSlugs);

    const existingSet = new Set(existingSlugs?.map(s => s.slug) || []);
    
    // Filter ra các slugs chưa tồn tại
    const availableSlugs = candidateSlugs.filter(slug => !existingSet.has(slug));
    
    // Nếu không đủ slugs, generate thêm
    if (availableSlugs.length < totalLinks) {
      const additionalNeeded = totalLinks - availableSlugs.length;
      let attempts = 0;
      
      while (availableSlugs.length < totalLinks && attempts < 5) {
        const moreSlugs = generateUniqueSlugs(additionalNeeded * 2);
        
        const { data: moreExisting } = await supabase
          .from('links')
          .select('slug')
          .in('slug', moreSlugs);
        
        const moreExistingSet = new Set(moreExisting?.map(s => s.slug) || []);
        const moreAvailable = moreSlugs.filter(slug => 
          !moreExistingSet.has(slug) && !availableSlugs.includes(slug)
        );
        
        availableSlugs.push(...moreAvailable);
        attempts++;
      }
    }

    if (availableSlugs.length < totalLinks) {
      return { 
        success: false, 
        error: `Only generated ${availableSlugs.length}/${totalLinks} unique slugs. Please try again.` 
      };
    }

    // ✅ Tạo links với slugs đã verify
    const linksToCreate = data.videoUrls.map((videoUrl, index) => ({
      user_id: data.userId,
      slug: availableSlugs[index],
      video_url: videoUrl,
      destination_url: data.destinationUrl,
      redirect_enabled: data.redirectEnabled,
      telegram_url: data.telegramUrl,
      web_url: data.webUrl,
    }));

    // Insert all links
    const { error } = await supabase
      .from('links')
      .insert(linksToCreate);

    if (error) {
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

