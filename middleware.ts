import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const userAgent = request.headers.get('user-agent') || '';
  
  // 🛡️ BLOCK FACEBOOK BOTS (giảm 85% requests từ Washington D.C.)
  const isFacebookBot = 
    userAgent.includes('facebookexternalhit') ||
    userAgent.includes('Facebot') ||
    userAgent.includes('facebookplatform') ||
    userAgent.includes('Facebook') ||
    userAgent.includes('facebook');
  
  if (isFacebookBot) {
    console.log('🤖 Facebook bot blocked:', userAgent);
    
    return new Response('Facebook bots are not allowed', { 
      status: 403,
      headers: {
        'Content-Type': 'text/plain',
        'X-Blocked-Reason': 'Facebook bot detected'
      }
    });
  }
  
  // ✅ Allow real users and search engine bots (Google, Bing for SEO)
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

