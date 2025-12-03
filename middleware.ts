import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🤖 Comprehensive bot detection patterns
const BOT_PATTERNS = [
  // Facebook bots
  'facebookexternalhit', 'Facebot', 'facebookplatform', 'Facebook', 'facebook',
  // Twitter/X bots
  'Twitterbot', 'TwitterAndroid', 'TwitteriPhone',
  // Other social media bots
  'LinkedInBot', 'Pinterest', 'Slackbot', 'TelegramBot', 'WhatsApp', 'Discordbot',
  // Generic scrapers/crawlers
  'Crawler', 'Spider', 'Bot/', 'bot/', 'curl/', 'wget/', 'python-requests',
  'Scrapy', 'HeadlessChrome', 'PhantomJS', 'Selenium',
  // SEO tools (block to save costs, keep Googlebot for SEO)
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'YandexBot',
  'Baiduspider', 'Sogou', 'Exabot', 'ia_archiver', 'archive.org_bot',
  // AI crawlers
  'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Bytespider',
  'PetalBot', 'Amazonbot',
  // Generic patterns
  'bot', 'crawl', 'spider', 'slurp', 'mediapartners',
];

// ✅ Whitelist: Allow these bots for SEO
const ALLOWED_BOTS = ['Googlebot', 'bingbot', 'Applebot'];

function isBot(userAgent: string): boolean {
  const lowerUA = userAgent.toLowerCase();
  
  // First check whitelist
  for (const allowed of ALLOWED_BOTS) {
    if (lowerUA.includes(allowed.toLowerCase())) {
      return false; // Allow Google, Bing, Apple for SEO
    }
  }
  
  // Then check blacklist
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
  
  // 🛡️ BLOCK BOTS - Giảm đến 70% function invocations!
  if (isBot(userAgent)) {
    // Allow bots to access the homepage for SEO
    if (pathname === '/') {
      return await updateSession(request);
    }
    
    // Block bots from API routes entirely
    if (pathname.startsWith('/api/')) {
      console.log('🤖 Bot blocked from API:', userAgent.substring(0, 50));
      return new Response('Bot access not allowed', { 
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-Blocked-Reason': 'Bot detected'
        }
      });
    }
    
    // For other pages, return minimal response to save bandwidth
    console.log('🤖 Bot blocked:', userAgent.substring(0, 50));
    return new Response('Bot access not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Bot detected'
      }
    });
  }
  
  // ✅ Allow real users and whitelisted bots
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
