import { createClient } from '@/lib/supabase/edge';

/**
 * 🚀 EDGE RUNTIME - FREE INVOCATIONS!
 * ✅ Bot blocking at Edge (before database writes)
 * ✅ Scalable to millions of requests
 * ✅ Low latency (global distribution)
 */
export const runtime = 'edge';

/**
 * ✅ FULL BOT DETECTION - BLOCKS ALL BOTS INCLUDING FACEBOOK
 * Real users from Facebook ads have normal browser user-agents (Chrome/Safari)
 * Only bots (facebookexternalhit, etc) are blocked
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
 * 🚀 Running on Edge Runtime for FREE invocations and global distribution
 */
export async function POST(request: Request) {
  try {
    const userAgent = request.headers.get('user-agent') || '';
    
    // ✅ BLOCK BOTS AT EDGE (before any database operations)
    if (isBot(userAgent)) {
      console.log('🚫 Bot blocked at Edge:', userAgent);
      return new Response(
        JSON.stringify({ success: true, blocked: 'bot' }), 
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { linkId } = body;

    if (!linkId) {
      return new Response(
        JSON.stringify({ error: 'Missing linkId' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient();

    // Only increment daily view count (online session tracking removed)
    const { error: viewError } = await supabase.rpc('increment_daily_views', {
      p_link_id: linkId,
      p_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    if (viewError) {
      console.error('Track view error:', viewError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: viewError.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Track error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

