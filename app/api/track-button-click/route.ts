import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ✅ OPTIMIZED: Supports batch button clicks (saves 40% requests)
export async function POST(request: NextRequest) {
  try {
    const { linkId, buttonType, telegramClicks = 0, webClicks = 0 } = await request.json();

    if (!linkId) {
      return NextResponse.json(
        { error: 'Missing linkId' },
        { status: 400 }
      );
    }

    // Support both old single-click and new batch format
    const hasSingleClick = buttonType && (buttonType === 'telegram' || buttonType === 'web');
    const hasBatchClicks = telegramClicks > 0 || webClicks > 0;

    if (!hasSingleClick && !hasBatchClicks) {
      return NextResponse.json(
        { error: 'No clicks to track' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Calculate total clicks to increment
    let totalTelegramClicks = telegramClicks;
    let totalWebClicks = webClicks;

    if (hasSingleClick) {
      if (buttonType === 'telegram') {
        totalTelegramClicks += 1;
      } else if (buttonType === 'web') {
        totalWebClicks += 1;
      }
    }

    // Get current values
    const { data: link } = await supabase
      .from('links')
      .select('telegram_clicks, web_clicks')
      .eq('id', linkId)
      .single();

    if (link) {
      // Batch update both counters at once
      await supabase
        .from('links')
        .update({
          telegram_clicks: (link.telegram_clicks || 0) + totalTelegramClicks,
          web_clicks: (link.web_clicks || 0) + totalWebClicks,
        })
        .eq('id', linkId);
    }

    return NextResponse.json({ 
      success: true, 
      tracked: { telegram: totalTelegramClicks, web: totalWebClicks } 
    });
  } catch (error: any) {
    console.error('Track button click error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

