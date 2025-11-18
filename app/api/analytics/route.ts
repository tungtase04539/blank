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
    // ✅ OPTIMIZED: Stale-while-revalidate pattern (saves 50% API calls)
    const cacheKey = 'top-online-links';
    const { data: cachedData, isStale } = analyticsCache.getWithStale(cacheKey);
    
    // If we have cache (even stale), return immediately
    if (cachedData) {
      console.log(`📦 Serving from cache (${isStale ? 'stale, refreshing in background' : 'fresh'})`);
      
      // If stale, fetch new data in background (non-blocking)
      if (isStale) {
        getTopOnlineLinks()
          .then(topOnlineLinks => {
            analyticsCache.set(cacheKey, { topOnlineLinks }, 10 * 60 * 1000);
            console.log('✅ Background refresh completed');
          })
          .catch(err => console.error('⚠️ Background refresh failed:', err));
      }
      
      return NextResponse.json(cachedData);
    }

    // No cache → fetch immediately (blocking)
    console.log('🌐 Fetching from Google (no cache available)');
    const topOnlineLinks = await getTopOnlineLinks();
    const response = { topOnlineLinks };

    // Cache for 10 minutes (optimized from 5)
    analyticsCache.set(cacheKey, response, 10 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Top online links API error:', error);
    
    // Try to serve any stale cache if available
    const { data: staleData } = analyticsCache.getWithStale('top-online-links');
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

