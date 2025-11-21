import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * ✅ BOT DETECTION WITH FACEBOOK BOTS BLOCKED
 * Real users from Facebook ads will have normal browser user-agents
 */
function isBot(userAgent: string): boolean {
  const botPatterns = [
    // Common crawlers
    'bot', 'crawler', 'spider', 'scraper',
    // Search engines
    'googlebot', 'bingbot', 'yahoo', 'duckduckbot', 'baiduspider', 'yandex',
    // Facebook & Social media bots (NOT real users!)
    'facebookexternalhit',  // Facebook link preview crawler
    'facebookcatalog',       // Facebook catalog crawler
    'facebot',               // Facebook's web crawler
    'facebook',              // Generic Facebook bot (be careful, check if needed)
    'twitterbot', 
    'linkedinbot', 
    'slackbot', 
    'discordbot',
    'whatsapp',              // WhatsApp link preview
    'telegrambot',           // Telegram bot
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
    // ⚠️ BOT DETECTION DISABLED - Track all traffic for now
    // Will optimize later after confirming tracking works
    const userAgent = request.headers.get('user-agent') || '';
    
    // TEMPORARY: Only block obvious crawlers, allow Facebook/social traffic
    const isObviousCrawler = /googlebot|bingbot|crawler|spider|semrush|ahrefs/i.test(userAgent);
    if (isObviousCrawler) {
      console.log('🚫 Crawler blocked:', userAgent);
      return NextResponse.json({ success: true, blocked: 'crawler' }, { status: 200 });
    }

    const { linkId } = await request.json();

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
      console.error('Track view error:', viewError);
      return NextResponse.json({ 
        success: false, 
        error: viewError.message 
      }, { status: 500 });
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

