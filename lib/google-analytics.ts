import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize GA Data API client
const analyticsDataClient = new BetaAnalyticsDataClient({
  credentials: {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

const propertyId = process.env.GA_PROPERTY_ID;

export interface GAStats {
  totalViews: number;
  totalUsers: number;
  topPages: Array<{
    page: string;
    views: number;
    users: number;
  }>;
  dailyStats: Array<{
    date: string;
    views: number;
    users: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  trafficSources: Array<{
    source: string;
    users: number;
  }>;
}

/**
 * Get analytics data for last N days
 */
export async function getAnalyticsData(days: number = 7): Promise<GAStats | null> {
  try {
    if (!propertyId) {
      console.warn('GA_PROPERTY_ID not configured');
      return null;
    }

    const [overviewResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
    });

    // Get top pages
    const [pagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'screenPageViews',
          },
          desc: true,
        },
      ],
      limit: 10,
    });

    // Get device breakdown
    const [deviceResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'deviceCategory' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    // Get traffic sources
    const [sourceResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'sessionSource' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 5,
    });

    // Parse daily stats
    const dailyStats = overviewResponse.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      views: parseInt(row.metricValues?.[0].value || '0'),
      users: parseInt(row.metricValues?.[1].value || '0'),
    })) || [];

    // Calculate totals
    const totalViews = dailyStats.reduce((sum, day) => sum + day.views, 0);
    const totalUsers = dailyStats.reduce((sum, day) => sum + day.users, 0);

    // Parse top pages
    const topPages = pagesResponse.rows?.map(row => ({
      page: row.dimensionValues?.[0].value || '',
      views: parseInt(row.metricValues?.[0].value || '0'),
      users: parseInt(row.metricValues?.[1].value || '0'),
    })) || [];

    // Parse device breakdown
    const deviceBreakdown = {
      desktop: 0,
      mobile: 0,
      tablet: 0,
    };
    deviceResponse.rows?.forEach(row => {
      const device = row.dimensionValues?.[0].value?.toLowerCase() || '';
      const users = parseInt(row.metricValues?.[0].value || '0');
      if (device === 'desktop') deviceBreakdown.desktop = users;
      else if (device === 'mobile') deviceBreakdown.mobile = users;
      else if (device === 'tablet') deviceBreakdown.tablet = users;
    });

    // Parse traffic sources
    const trafficSources = sourceResponse.rows?.map(row => ({
      source: row.dimensionValues?.[0].value || 'Direct',
      users: parseInt(row.metricValues?.[0].value || '0'),
    })) || [];

    return {
      totalViews,
      totalUsers,
      topPages,
      dailyStats,
      deviceBreakdown,
      trafficSources,
    };
  } catch (error) {
    console.error('Error fetching GA data:', error);
    return null;
  }
}

/**
 * Get real-time active users (last 30 minutes)
 */
export async function getRealtimeUsers(): Promise<number> {
  try {
    if (!propertyId) return 0;

    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [
        { name: 'activeUsers' },
      ],
    });

    return parseInt(response.rows?.[0]?.metricValues?.[0].value || '0');
  } catch (error) {
    console.error('Error fetching realtime data:', error);
    return 0;
  }
}

/**
 * Get top 10 links by real-time online users
 */
export async function getTopOnlineLinks(): Promise<Array<{ page: string; activeUsers: number }>> {
  try {
    if (!propertyId) return [];

    const [response] = await analyticsDataClient.runRealtimeReport({
      property: `properties/${propertyId}`,
      dimensions: [
        { name: 'pagePath' },
      ],
      metrics: [
        { name: 'activeUsers' },
      ],
      orderBys: [
        {
          metric: {
            metricName: 'activeUsers',
          },
          desc: true,
        },
      ],
      limit: 10,
    });

    return response.rows?.map(row => ({
      page: row.dimensionValues?.[0].value || '',
      activeUsers: parseInt(row.metricValues?.[0].value || '0'),
    })).filter(link => link.page !== '/' && link.activeUsers > 0) || [];
  } catch (error) {
    console.error('Error fetching top online links:', error);
    return [];
  }
}

/**
 * Get analytics for specific link by slug
 */
export async function getLinkAnalytics(slug: string, days: number = 7) {
  try {
    if (!propertyId) return null;

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: `${days}daysAgo`,
          endDate: 'today',
        },
      ],
      dimensions: [
        { name: 'date' },
      ],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'activeUsers' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'pagePath',
          stringFilter: {
            matchType: 'EXACT',
            value: `/${slug}`,
          },
        },
      },
    });

    const dailyStats = response.rows?.map(row => ({
      date: row.dimensionValues?.[0].value || '',
      views: parseInt(row.metricValues?.[0].value || '0'),
      users: parseInt(row.metricValues?.[1].value || '0'),
    })) || [];

    return {
      totalViews: dailyStats.reduce((sum, day) => sum + day.views, 0),
      totalUsers: dailyStats.reduce((sum, day) => sum + day.users, 0),
      dailyStats,
    };
  } catch (error) {
    console.error('Error fetching link analytics:', error);
    return null;
  }
}

