import { NextRequest, NextResponse } from 'next/server';
import { getSmartRedirectUrl } from '@/app/[slug]/actions';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const result = await getSmartRedirectUrl(userId, ip);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Smart redirect API error:', error);
    return NextResponse.json({ shouldRedirect: false, url: null });
  }
}

