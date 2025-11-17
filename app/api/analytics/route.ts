import { NextResponse } from 'next/server';
import { getAnalyticsData, getRealtimeUsers } from '@/lib/google-analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch data from Google Analytics
    const analyticsData = await getAnalyticsData(7);
    const realtimeUsers = await getRealtimeUsers();

    if (!analyticsData) {
      return NextResponse.json({
        totalViews: 0,
        totalUsers: 0,
        realtimeUsers: 0,
        dailyStats: [],
      });
    }

    return NextResponse.json({
      totalViews: analyticsData.totalViews,
      totalUsers: analyticsData.totalUsers,
      realtimeUsers,
      dailyStats: analyticsData.dailyStats,
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

