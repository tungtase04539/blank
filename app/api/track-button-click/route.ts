import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { linkId, buttonType } = await request.json();

    if (!linkId || !buttonType) {
      return NextResponse.json(
        { error: 'Missing linkId or buttonType' },
        { status: 400 }
      );
    }

    if (buttonType !== 'telegram' && buttonType !== 'web') {
      return NextResponse.json(
        { error: 'Invalid buttonType' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Increment the appropriate counter
    const column = buttonType === 'telegram' ? 'telegram_clicks' : 'web_clicks';
    
    const { error } = await supabase.rpc('increment_button_click', {
      link_id: linkId,
      button_column: column
    });

    if (error) {
      // Fallback: manual increment if RPC doesn't exist
      const { data: link } = await supabase
        .from('links')
        .select('telegram_clicks, web_clicks')
        .eq('id', linkId)
        .single();

      if (link) {
        const currentValue = buttonType === 'telegram' 
          ? (link.telegram_clicks || 0) 
          : (link.web_clicks || 0);
        
        await supabase
          .from('links')
          .update({ [column]: currentValue + 1 })
          .eq('id', linkId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track button click error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

