import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// 🤖 Bot detection patterns
const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'facebookplatform',
  'Twitterbot', 'LinkedInBot',
  'Slackbot-LinkExpanding', 'Discordbot', 'TelegramBot', 'vkShare', 'Pinterestbot',
  'curl/', 'wget/', 'python-requests', 'python-urllib', 'Scrapy', 'HttpClient', 'Java/', 'okhttp', 'axios/',
  'HeadlessChrome', 'PhantomJS', 'Selenium', 'webdriver',
  'AhrefsBot', 'SemrushBot', 'MJ12bot', 'DotBot', 'BLEXBot', 'YandexBot', 'Baiduspider',
  'Sogou', 'Exabot', 'ia_archiver', 'archive.org_bot', 'PetalBot', 'DataForSeoBot', 'SiteAuditBot', 'Screaming Frog',
  'GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web', 'Bytespider', 'Amazonbot', 'Meta-ExternalAgent',
  'Mediapartners-Google', 'AdsBot-Google', 'Storebot-Google',
];

const ALLOWED_BOTS = ['Googlebot', 'bingbot', 'Applebot', 'DuckDuckBot'];

function isBot(userAgent: string): boolean {
  if (!userAgent || userAgent.length < 10) return true;
  
  const lowerUA = userAgent.toLowerCase();
  
  for (const allowed of ALLOWED_BOTS) {
    if (lowerUA.includes(allowed.toLowerCase())) return false;
  }
  
  for (const pattern of BOT_PATTERNS) {
    if (lowerUA.includes(pattern.toLowerCase())) return true;
  }
  
  return false;
}

// Các routes cần auth (cần updateSession)
const AUTH_ROUTES = ['/dashboard', '/admin', '/links', '/scripts', '/settings', '/statistics', '/redirects', '/login'];

function needsAuth(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // ✅ FAST PATH: Skip static files hoàn toàn
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }
  
  const userAgent = request.headers.get('user-agent') || '';
  
  // 🛡️ BLOCK BOTS cho public pages và API
  if (isBot(userAgent)) {
    if (pathname === '/') {
      // Homepage: cho phép bots (SEO)
      return needsAuth(pathname) ? await updateSession(request) : NextResponse.next();
    }
    
    // Block bots từ tất cả routes khác
    return new Response('', { status: 403 });
  }
  
  // ✅ AUTH ROUTES: Cần updateSession (dashboard, admin, etc.)
  if (needsAuth(pathname)) {
    return await updateSession(request);
  }
  
  // ✅ PUBLIC ROUTES (/[slug], /api/*): KHÔNG cần updateSession
  // Giảm 90% Supabase auth calls!
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
