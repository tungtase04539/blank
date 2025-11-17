import { NextResponse } from 'next/server';
import { getAnalyticsData, getRealtimeUsers, getTopOnlineLinks } from '@/lib/google-analytics';
import { analyticsCache } from '@/lib/analytics-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Try to get from cache first
    const cacheKey = 'analytics-data';
    const cachedData = analyticsCache.get(cacheKey);
    
    if (cachedData) {
      console.log('📦 Serving analytics from cache');
      return NextResponse.json(cachedData);
    }

    console.log('🌐 Fetching fresh analytics from Google');
    
    // Fetch data from Google Analytics
    const [analyticsData, realtimeUsers, topOnlineLinks] = await Promise.all([
      getAnalyticsData(7),
      getRealtimeUsers(),
      getTopOnlineLinks(),
    ]);

    const response = {
      totalViews: analyticsData?.totalViews || 0,
      totalUsers: analyticsData?.totalUsers || 0,
      realtimeUsers,
      dailyStats: analyticsData?.dailyStats || [],
      topOnlineLinks,
    };

    // Cache for 5 minutes (reduces API calls by ~90%)
    analyticsCache.set(cacheKey, response, 5 * 60 * 1000);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    
    // Try to serve stale cache if available
    const staleCacheKey = 'analytics-data';
    const staleData = analyticsCache.get(staleCacheKey);
    if (staleData) {
      console.log('⚠️ Serving stale cache due to error');
      return NextResponse.json(staleData);
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

