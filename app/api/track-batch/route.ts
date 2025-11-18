import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface TrackEvent {
  linkId: string;
  sessionId: string;
  timestamp: number;
}

/**
 * Batch tracking endpoint
 * Processes multiple tracking events at once
 * Reduces API calls by up to 90%!
 */
export async function POST(request: NextRequest) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid events array' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Group events by linkId to reduce duplicate calls
    const eventsByLink = new Map<string, { linkId: string; sessionIds: Set<string> }>();

    for (const event of events) {
      if (!event.linkId || !event.sessionId) continue;

      if (!eventsByLink.has(event.linkId)) {
        eventsByLink.set(event.linkId, {
          linkId: event.linkId,
          sessionIds: new Set(),
        });
      }

      eventsByLink.get(event.linkId)!.sessionIds.add(event.sessionId);
    }

    const today = new Date().toISOString().split('T')[0];

    // Process each link's events
    const promises: Promise<any>[] = [];

    // Convert Map values to array for ES5 compatibility
    eventsByLink.forEach(({ linkId, sessionIds }) => {
      // One view increment per link
      promises.push(
        supabase.rpc('increment_daily_views', {
          p_link_id: linkId,
          p_date: today,
        })
      );

      // One session update per unique sessionId
      sessionIds.forEach((sessionId) => {
        promises.push(
          supabase.rpc('update_online_session', {
            p_link_id: linkId,
            p_session_id: sessionId,
          })
        );
      });
    });

    // Execute all in parallel
    const results = await Promise.allSettled(promises);

    // Count errors
    const errors = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      processed: events.length,
      errors,
    });
  } catch (error: any) {
    console.error('Batch track error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

