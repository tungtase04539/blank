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
    return { success: true };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

export async function createMultiLinksAction(data: CreateMultiLinksData) {
  try {
    const supabase = await createClient();
    const linksToCreate = [];

    // Generate unique slugs for each video
    for (const videoUrl of data.videoUrls) {
      let slug = generateSlug();
      let attempts = 0;
      const maxAttempts = 10;

      // Ensure slug is unique
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('links')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!existing) break;
        
        slug = generateSlug();
        attempts++;
      }

      if (attempts >= maxAttempts) {
        return { success: false, error: 'Cannot create unique slug' };
      }

      linksToCreate.push({
        user_id: data.userId,
        slug: slug,
        video_url: videoUrl,
        destination_url: data.destinationUrl,
        redirect_enabled: data.redirectEnabled,
        telegram_url: data.telegramUrl,
        web_url: data.webUrl,
      });
    }

    // Insert all links
    const { error } = await supabase
      .from('links')
      .insert(linksToCreate);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/links');
    return { 
      success: true, 
      count: linksToCreate.length,
      slugs: linksToCreate.map(link => link.slug)
    };
  } catch (error) {
    return { success: false, error: 'An error occurred' };
  }
}

