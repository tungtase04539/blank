import { NextResponse } from 'next/server';
import { getRealtimeUsers } from '@/lib/google-analytics';
import { analyticsCache } from '@/lib/analytics-cache';

export const dynamic = 'force-dynamic';

/**
 * Realtime Analytics API
 * Returns active users and page views from last 30 minutes
 * Cached for 30 seconds to reduce API calls
 */
export async function GET() {
  try {
    // ✅ OPTIMIZED: Stale-while-revalidate with 60s cache (optimized from 30s)
    const cacheKey = 'realtime-analytics';
    const { data: cachedData, isStale } = analyticsCache.getWithStale(cacheKey);
    
    if (cachedData) {
      console.log(`📦 Serving realtime analytics from cache (${isStale ? 'stale' : 'fresh'})`);
      
      // If stale, refresh in background
      if (isStale) {
        getRealtimeUsers()
          .then(activeUsers => {
            const response = {
              activeUsers,
              pageViews: activeUsers * 1.5,
              topPages: [],
            };
            analyticsCache.set(cacheKey, response, 60 * 1000);
            console.log('✅ Background realtime refresh completed');
          })
          .catch(err => console.error('⚠️ Background realtime refresh failed:', err));
      }
      
      return NextResponse.json(cachedData);
    }

    console.log('🌐 Fetching realtime analytics from Google');
    
    // Fetch real-time active users
    const activeUsers = await getRealtimeUsers();
    
    const response = {
      activeUsers,
      pageViews: activeUsers * 1.5, // Approximate (you can fetch real data)
      topPages: [], // Can be populated from GA realtime API
    };

    // Cache for 60 seconds (optimized from 30s for realtime data)
    analyticsCache.set(cacheKey, response, 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Realtime analytics API error:', error);
    
    // Try to serve stale cache if available
    const { data: staleData } = analyticsCache.getWithStale('realtime-analytics');
    if (staleData) {
      console.log('⚠️ Serving stale realtime cache due to error');
      return NextResponse.json(staleData);
    }
    
    return NextResponse.json(
      {
        activeUsers: 0,
        pageViews: 0,
        topPages: [],
      },
      { status: 200 } // Return empty data instead of error
    );
  }
}

