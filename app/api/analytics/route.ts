import { NextResponse } from 'next/server';
import { getTopOnlineLinks } from '@/lib/google-analytics';
import { analyticsCache } from '@/lib/analytics-cache';

export const dynamic = 'force-dynamic';

/**
 * Lightweight API - Only fetches Top 10 Online Links
 * Real-time dashboard is handled by GA Embed (iframe)
 * This reduces API calls from 288/day to ~96/day (66% reduction)
 */
export async function GET() {
  try {
    // Try to get from cache first
    const cacheKey = 'top-online-links';
    const cachedData = analyticsCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Serving top online links from cache');
      return NextResponse.json(cachedData);
    }

    console.log('🌐 Fetching top online links from Google');
    
    // Only fetch Top 10 Online Links (1 API call instead of 3)
    const topOnlineLinks = await getTopOnlineLinks();

    const response = {
      topOnlineLinks,
    };

    // Cache for 5 minutes
    analyticsCache.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Top online links API error:', error);
    
    // Try to serve stale cache if available
    const staleData = analyticsCache.get('top-online-links');
    if (staleData) {
      console.log('⚠️ Serving stale cache due to error');
      return NextResponse.json(staleData);
    }
    
    return NextResponse.json(
      { topOnlineLinks: [] },
      { status: 200 } // Return empty array instead of error
    );
  }
}

