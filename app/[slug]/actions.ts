'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function trackVisitAction(linkId: string) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';
    const referer = headersList.get('referer') || null;
    
    // Track visit
    await supabase
      .from('link_visits')
      .insert({
        link_id: linkId,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
      });
    
    // Update or create online session (upsert)
    await supabase
      .from('online_sessions')
      .upsert({
        link_id: linkId,
        ip_address: ip,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'link_id,ip_address',
      });
    
    // Clean up old sessions (older than 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    await supabase
      .from('online_sessions')
      .delete()
      .lt('last_active', thirtyMinutesAgo);
      
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
}

// Removed getSmartRedirectUrl - now using simple random in API route

