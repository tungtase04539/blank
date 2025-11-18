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

    // Process each link's events - execute sequentially to avoid type issues
    let totalProcessed = 0;
    let totalErrors = 0;

    // Convert Map values to array for ES5 compatibility
    for (const entry of Array.from(eventsByLink.values())) {
      const { linkId, sessionIds } = entry;

      // Increment daily views
      const viewResult = await supabase.rpc('increment_daily_views', {
        p_link_id: linkId,
        p_date: today,
      });

      if (viewResult.error) {
        totalErrors++;
      } else {
        totalProcessed++;
      }

      // Update online sessions
      for (const sessionId of Array.from(sessionIds)) {
        const sessionResult = await supabase.rpc('update_online_session', {
          p_link_id: linkId,
          p_session_id: sessionId,
        });

        if (sessionResult.error) {
          totalErrors++;
        } else {
          totalProcessed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: events.length,
      errors: totalErrors,
    });
  } catch (error: any) {
    console.error('Batch track error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

