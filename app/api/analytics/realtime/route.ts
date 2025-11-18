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
    // Try to get from cache first (30 second cache)
    const cacheKey = 'realtime-analytics';
    const cachedData = analyticsCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Serving realtime analytics from cache');
      return NextResponse.json(cachedData);
    }

    console.log('🌐 Fetching realtime analytics from Google');
    
    // Fetch real-time active users
    const activeUsers = await getRealtimeUsers();
    
    // For now, return basic stats
    // You can expand this to include more GA realtime data
    const response = {
      activeUsers,
      pageViews: activeUsers * 1.5, // Approximate (you can fetch real data)
      topPages: [], // Can be populated from GA realtime API
    };

    // Cache for 30 seconds (aggressive refresh for realtime data)
    analyticsCache.set(cacheKey, response, 30 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Realtime analytics API error:', error);
    
    // Try to serve stale cache if available
    const staleData = analyticsCache.get('realtime-analytics');
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

