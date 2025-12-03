import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🤖 Bot detection patterns - CHỈ các pattern chắc chắn là BOT
// ⚠️ KHÔNG block in-app browsers (WhatsApp, Facebook, Twitter app users)
const BOT_PATTERNS = [
  // Facebook bots (specific bot patterns only)
  'facebookexternalhit',  // Facebook link preview bot
  'Facebot',              // Facebook crawler
  'facebookplatform',     // Facebook platform bot
  
  // Twitter/X bots (specific bot patterns only)
  'Twitterbot',           // Twitter link preview bot
  
  // LinkedIn bot
  'LinkedInBot',          // LinkedIn link preview bot
  
  // Other platform bots (specific patterns)
  'Slackbot-LinkExpanding', // Slack link preview
  'Discordbot',           // Discord link preview
  'TelegramBot',          // Telegram bot API (not user browser)
  'vkShare',              // VK share bot
  'Pinterestbot',         // Pinterest crawler (not app)
  
  // Generic scrapers/crawlers (safe to block)
  'curl/',                // curl command line
  'wget/',                // wget command line
  'python-requests',      // Python requests library
  'python-urllib',        // Python urllib
  'Scrapy',               // Scrapy spider
  'HttpClient',           // Generic HTTP clients
  'Java/',                // Java HTTP clients
  'okhttp',               // OkHttp client
  'axios/',               // Axios (when used server-side)
  
  // Headless browsers (usually bots/scrapers)
  'HeadlessChrome',       // Puppeteer/Playwright
  'PhantomJS',            // PhantomJS
  'Selenium',             // Selenium WebDriver
  'webdriver',            // Generic webdriver
  
  // SEO tools & crawlers
  'AhrefsBot',
  'SemrushBot', 
  'MJ12bot',
  'DotBot',
  'BLEXBot',
  'YandexBot',
  'Baiduspider',
  'Sogou',
  'Exabot',
  'ia_archiver',
  'archive.org_bot',
  'PetalBot',
  'DataForSeoBot',
  'SiteAuditBot',
  'Screaming Frog',
  
  // AI crawlers
  'GPTBot',               // OpenAI
  'ChatGPT-User',         // ChatGPT browsing
  'CCBot',                // Common Crawl
  'anthropic-ai',         // Anthropic
  'Claude-Web',           // Claude
  'Bytespider',           // ByteDance
  'Amazonbot',            // Amazon
  'Meta-ExternalAgent',   // Meta AI
  
  // Other known bots
  'Mediapartners-Google', // Google Adsense (not search)
  'AdsBot-Google',        // Google Ads bot
  'Storebot-Google',      // Google Shopping
];

// ✅ Whitelist: Allow these bots for SEO
const ALLOWED_BOTS = ['Googlebot', 'bingbot', 'Applebot', 'DuckDuckBot'];

function isBot(userAgent: string): boolean {
  // Empty user agent is suspicious
  if (!userAgent || userAgent.length < 10) {
    return true;
  }
  
  const lowerUA = userAgent.toLowerCase();
  
  // First check whitelist (allow SEO bots)
  for (const allowed of ALLOWED_BOTS) {
    if (lowerUA.includes(allowed.toLowerCase())) {
      return false;
    }
  }
  
  // Check blacklist (specific bot patterns only)
  for (const pattern of BOT_PATTERNS) {
    if (lowerUA.includes(pattern.toLowerCase())) {
      return true;
    }
  }
  
  return false;
}

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  const pathname = request.nextUrl.pathname;
  
  // 🛡️ BLOCK BOTS - Only specific bot patterns, NOT in-app browsers
  if (isBot(userAgent)) {
    // Allow bots to access the homepage for SEO
    if (pathname === '/') {
      return await updateSession(request);
    }
    
    // Block bots from API routes entirely
    if (pathname.startsWith('/api/')) {
      console.log('🤖 Bot blocked from API:', userAgent.substring(0, 60));
      return new Response('Bot access not allowed', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Blocked-Reason': 'Bot detected'
        }
      });
    }
    
    // For other pages, block bots
    console.log('🤖 Bot blocked:', userAgent.substring(0, 60));
    return new Response('Bot access not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Bot detected'
      }
    });
  }
  
  // ✅ Allow real users (including in-app browsers from WhatsApp, Facebook, Twitter, etc.)
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
