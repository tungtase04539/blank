import { NextResponse } from 'next/server';
import { getAnalyticsData, getRealtimeUsers, getTopOnlineLinks } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch data from Google Analytics
    const [analyticsData, realtimeUsers, topOnlineLinks] = await Promise.all([
      getAnalyticsData(7),
      getRealtimeUsers(),
      getTopOnlineLinks(),
    ]);

    if (!analyticsData) {
      return NextResponse.json({
        totalViews: 0,
        totalUsers: 0,
        realtimeUsers: 0,
        dailyStats: [],
        topOnlineLinks: [],
      });
    }

    return NextResponse.json({
      totalViews: analyticsData.totalViews,
      totalUsers: analyticsData.totalUsers,
      realtimeUsers,
      dailyStats: analyticsData.dailyStats,
      topOnlineLinks,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

