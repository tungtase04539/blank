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
    
    await supabase
      .from('link_visits')
      .insert({
        link_id: linkId,
        ip_address: ip,
        user_agent: userAgent,
        referer: referer,
      });
  } catch (error) {
    console.error('Error tracking visit:', error);
  }
}

