import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Get a random link slug (excluding current link)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const currentSlug = searchParams.get('current');

    const supabase = await createClient();

    // Get all active links except current one
    let query = supabase
      .from('links')
      .select('slug')
      .order('created_at', { ascending: false });

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

    return NextResponse.json({ slug: randomSlug });
  } catch (error: any) {
    console.error('Random link API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

