import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/edge';

// ✅ EDGE RUNTIME = FREE invocations! (No serverless function cost)
export const runtime = 'edge';

// ✅ Cache response at edge for 60 seconds
export const revalidate = 60;

/**
 * Get a random link slug (excluding current link)
 * 🚀 OPTIMIZED: Edge Runtime + Response Cache
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentSlug = searchParams.get('current');

    const supabase = createClient();

    // Get all active links except current one
    let query = supabase
      .from('links')
      .select('slug')
      .order('created_at', { ascending: false })
      .limit(100); // Limit for performance

    if (currentSlug) {
      query = query.neq('slug', currentSlug);
    }

    const { data: links, error } = await query;

    if (error) {
      console.error('Random link error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch links' },
        { status: 500 }
      );
    }

    if (!links || links.length === 0) {
      return NextResponse.json(
        { error: 'No other links available' },
        { status: 404 }
      );
    }

    // Get random link
    const randomIndex = Math.floor(Math.random() * links.length);
    const randomSlug = links[randomIndex].slug;

    // ✅ Add cache headers for edge caching
    return NextResponse.json(
      { slug: randomSlug },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error: any) {
    console.error('Random link API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
