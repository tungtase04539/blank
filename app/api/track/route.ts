import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * ✅ AGGRESSIVE BOT DETECTION (Blocks 90%+ of bot traffic)
 */
function isBot(userAgent: string): boolean {
  const botPatterns = [
    // Common crawlers
    'bot', 'crawler', 'spider', 'scraper',
    // Search engines
    'googlebot', 'bingbot', 'yahoo', 'duckduckbot', 'baiduspider', 'yandex',
    // Social media
    'facebookexternalhit', 'twitterbot', 'linkedinbot', 'slackbot', 'discordbot',
    // Analytics & monitors
    'semrush', 'ahrefs', 'moz', 'majestic', 'screenshot', 'pingdom', 'uptimerobot',
    // Other bots
    'headless', 'phantom', 'puppeteer', 'selenium', 'webdriver', 'cypress',
    'curl', 'wget', 'python', 'java', 'okhttp', 'go-http', 'node-fetch',
  ];
  
  const ua = userAgent.toLowerCase();
  return botPatterns.some(pattern => ua.includes(pattern));
}

/**
 * Track pageview only (online session tracking removed for cost optimization)
 * Optimized for high traffic scenarios
 */
export async function POST(request: NextRequest) {
  try {
    // ⚠️ BOT DETECTION TEMPORARILY DISABLED FOR DEBUGGING
    // Re-enable after confirming tracking works
    const userAgent = request.headers.get('user-agent') || '';
    console.log('📊 Tracking request - User-Agent:', userAgent);
    
    // Commented out bot detection for testing
    // if (!userAgent || isBot(userAgent)) {
    //   return NextResponse.json({ success: true, blocked: 'bot' }, { status: 200 });
    // }

    const { linkId } = await request.json();

    console.log('🔵 Tracking linkId:', linkId);

    if (!linkId) {
      return NextResponse.json(
        { error: 'Missing linkId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Only increment daily view count (online session tracking removed)
    const { error: viewError } = await supabase.rpc('increment_daily_views', {
      p_link_id: linkId,
      p_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    if (viewError) {
      console.error('❌ Track view error:', viewError);
      return NextResponse.json({ 
        success: false, 
        error: viewError.message 
      }, { status: 500 });
    }

    console.log('✅ Track view success for linkId:', linkId);
    return NextResponse.json({ success: true, tracked: true });
  } catch (error: any) {
    console.error('❌ Track error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

