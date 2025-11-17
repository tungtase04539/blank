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

export async function getSmartRedirectUrl(userId: string, currentIp: string) {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // Check redirect history for this IP
    const { data: history } = await supabase
      .from('redirect_history')
      .select('*')
      .eq('ip_address', currentIp)
      .single();
    
    // Clean up expired histories
    await supabase
      .from('redirect_history')
      .delete()
      .lt('expires_at', now.toISOString());
    
    // If IP has history and not expired
    if (history && new Date(history.expires_at) > now) {
      // If already redirected 2 times, no more redirect
      if (history.redirect_count >= 2) {
        return { shouldRedirect: false, url: null };
      }
    }
    
    // Get active redirect URLs for this user
    const { data: redirectUrls } = await supabase
      .from('redirect_urls')
      .select('url')
      .eq('user_id', userId)
      .eq('enabled', true);
    
    if (!redirectUrls || redirectUrls.length === 0) {
      return { shouldRedirect: false, url: null };
    }
    
    // Select URL (avoid last used URL if exists)
    let selectedUrl = redirectUrls[0].url;
    if (history && history.last_redirect_url && redirectUrls.length > 1) {
      // Find different URL
      const differentUrl = redirectUrls.find(u => u.url !== history.last_redirect_url);
      if (differentUrl) {
        selectedUrl = differentUrl.url;
      }
    }
    
    // Update or create history
    const newCount = history ? history.redirect_count + 1 : 1;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    
    await supabase
      .from('redirect_history')
      .upsert({
        ip_address: currentIp,
        redirect_count: newCount,
        last_redirect_url: selectedUrl,
        expires_at: expiresAt,
      }, {
        onConflict: 'ip_address',
      });
    
    return { shouldRedirect: true, url: selectedUrl };
  } catch (error) {
    console.error('Error getting smart redirect:', error);
    return { shouldRedirect: false, url: null };
  }
}

