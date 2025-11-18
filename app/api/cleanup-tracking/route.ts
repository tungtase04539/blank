import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Cleanup old tracking data
 * This endpoint should be called by a cron job (Vercel Cron, Supabase Edge Function, or external)
 * 
 * To secure this endpoint, add a secret token:
 * - Set CRON_SECRET in Vercel environment variables
 * - Call this endpoint with: Authorization: Bearer CRON_SECRET
 * 
 * Vercel Cron setup (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cleanup-tracking",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Optional: Check authorization token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();

    // Call cleanup function
    const { error } = await supabase.rpc('cleanup_old_sessions');

    if (error) {
      console.error('Cleanup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cleanup API error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggers
export async function POST(request: Request) {
  return GET(request);
}

