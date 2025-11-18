import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Track pageview and online session
 * Optimized to use ONE database function call
 */
export async function POST(request: NextRequest) {
  try {
    const { linkId, sessionId } = await request.json();

    if (!linkId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing linkId or sessionId' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Call 2 database functions in parallel (optimized!)
    const [viewResult, sessionResult] = await Promise.all([
      // Increment daily view count
      supabase.rpc('increment_daily_views', {
        p_link_id: linkId,
        p_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      }),
      // Update online session
      supabase.rpc('update_online_session', {
        p_link_id: linkId,
        p_session_id: sessionId,
      }),
    ]);

    if (viewResult.error) {
      console.error('Track view error:', viewResult.error);
    }

    if (sessionResult.error) {
      console.error('Track session error:', sessionResult.error);
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

