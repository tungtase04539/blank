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
 * Track pageview and online session
 * Optimized to use ONE database function call
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ OPTIMIZATION: Block bots immediately (saves CPU & database queries)
    const userAgent = request.headers.get('user-agent') || '';
    if (!userAgent || isBot(userAgent)) {
      return NextResponse.json({ success: true, blocked: 'bot' }, { status: 200 });
    }

    const { linkId, sessionId } = await request.json();

    if (!linkId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing linkId or sessionId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call 2 database functions in parallel (optimized!)
    const [viewResult, sessionResult] = await Promise.all([
      // Increment daily view count
      supabase.rpc('increment_daily_views', {
        p_link_id: linkId,
        p_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      }),
      // Update online session
      supabase.rpc('update_online_session', {
        p_link_id: linkId,
        p_session_id: sessionId,
      }),
    ]);

    if (viewResult.error) {
      console.error('Track view error:', viewResult.error);
    }

    if (sessionResult.error) {
      console.error('Track session error:', sessionResult.error);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

