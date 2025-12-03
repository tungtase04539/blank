import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/edge';

// ✅ EDGE RUNTIME = FREE invocations!
export const runtime = 'edge';

/**
 * Get random redirect URL from user's enabled list
 * Used for auto-redirect when video ends
 * 🚀 OPTIMIZED: Edge Runtime
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get all enabled redirect URLs for this user
    const { data: urls, error } = await supabase
      .from('redirect_urls')
      .select('url')
      .eq('user_id', userId)
      .eq('enabled', true);

    if (error) {
      console.error('Redirect URLs error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch redirect URLs' },
        { status: 500 }
      );
    }

    if (!urls || urls.length === 0) {
      return NextResponse.json(
        { url: null, message: 'No redirect URLs configured' },
        { status: 200 }
      );
    }

    // Random select one URL from the list
    const randomIndex = Math.floor(Math.random() * urls.length);
    const redirectUrl = urls[randomIndex].url;

    return NextResponse.json({ 
      url: redirectUrl,
      total: urls.length 
    });
  } catch (error: any) {
    console.error('Redirect URLs API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
