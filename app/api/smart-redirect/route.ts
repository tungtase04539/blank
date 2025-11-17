import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    const supabase = await createClient();
    
    // Get active redirect URLs for this user
    const { data: redirectUrls } = await supabase
      .from('redirect_urls')
      .select('url')
      .eq('user_id', userId)
      .eq('enabled', true);
    
    if (!redirectUrls || redirectUrls.length === 0) {
      return NextResponse.json({ shouldRedirect: false, url: null });
    }
    
    // Simple random selection
    const randomIndex = Math.floor(Math.random() * redirectUrls.length);
    const selectedUrl = redirectUrls[randomIndex].url;
    
    return NextResponse.json({ shouldRedirect: true, url: selectedUrl });
  } catch (error) {
    console.error('Random redirect API error:', error);
    return NextResponse.json({ shouldRedirect: false, url: null });
  }
}

