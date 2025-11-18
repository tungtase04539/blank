import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Fetch real-time dashboard stats
 * Used for auto-refresh every 30 seconds
 */
export async function GET() {
  try {
    const user = await getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Fetch link stats using the view
    const { data: links, error } = await supabase
      .from('link_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('total_views', { ascending: false });

    if (error) {
      console.error('Dashboard stats error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ links: links || [] });
  } catch (error: any) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

