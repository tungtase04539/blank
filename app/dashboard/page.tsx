import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import TrafficChart from './TrafficChart';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DailyStats } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getDashboardStats(userId: string) {
  const supabase = await createClient();
  
  // Get total links
  const { count: totalLinks } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get total visits and button clicks
  const { data: links } = await supabase
    .from('links')
    .select('id, telegram_clicks, web_clicks')
    .eq('user_id', userId);
  
  const linkIds = links?.map(l => l.id) || [];
  
  const { count: totalVisits } = await supabase
    .from('link_visits')
    .select('*', { count: 'exact', head: true })
    .in('link_id', linkIds.length > 0 ? linkIds : ['']);
  
  // Calculate total button clicks
  const totalTelegramClicks = links?.reduce((sum, link) => sum + (link.telegram_clicks || 0), 0) || 0;
  const totalWebClicks = links?.reduce((sum, link) => sum + (link.web_clicks || 0), 0) || 0;
  
  // Get total online (sessions active in last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { count: totalOnline } = await supabase
    .from('online_sessions')
    .select('*', { count: 'exact', head: true })
    .in('link_id', linkIds.length > 0 ? linkIds : [''])
    .gte('last_active', thirtyMinutesAgo);
  
  // Get visits for last 7 days
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      label: format(date, 'dd/MM'),
      start: startOfDay(date).toISOString(),
      end: endOfDay(date).toISOString(),
    };
  });
  
  const dailyStats: DailyStats[] = await Promise.all(
    last7Days.map(async (day) => {
      const { count } = await supabase
        .from('link_visits')
        .select('*', { count: 'exact', head: true })
        .in('link_id', linkIds.length > 0 ? linkIds : [''])
        .gte('visited_at', day.start)
        .lte('visited_at', day.end);
      
      return {
        date: day.label,
        visits: count || 0,
      };
    })
  );
  
  // Get top links
  const topLinks = await Promise.all(
    (links || []).slice(0, 5).map(async (link) => {
      const { count } = await supabase
        .from('link_visits')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', link.id);
      
      const { data: linkData } = await supabase
        .from('links')
        .select('*')
        .eq('id', link.id)
        .single();
      
      return {
        ...linkData,
        visit_count: count || 0,
      };
    })
  );
  
  topLinks.sort((a, b) => b.visit_count - a.visit_count);
  
  return {
    totalLinks: totalLinks || 0,
    totalVisits: totalVisits || 0,
    totalOnline: totalOnline || 0,
    totalTelegramClicks,
    totalWebClicks,
    dailyStats,
    topLinks: topLinks.slice(0, 5),
  };
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const stats = await getDashboardStats(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your links and traffic</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-100 text-sm font-medium">Total Links</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalLinks}</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-100 text-sm font-medium">Total Clicks</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalVisits.toLocaleString()}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-orange-100 text-sm font-medium">Online Now</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold flex items-center">
              {stats.totalOnline}
              {stats.totalOnline > 0 && (
                <span className="ml-3 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-orange-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              )}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-purple-100 text-sm font-medium">Avg Clicks/Link</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">
              {stats.totalLinks > 0 ? Math.round(stats.totalVisits / stats.totalLinks) : 0}
            </div>
          </div>
        </div>

        {/* Button Clicks Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-blue-100 text-sm font-medium">📱 Telegram Clicks</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalTelegramClicks.toLocaleString()}</div>
            <p className="text-blue-100 text-sm mt-2">Total clicks on Telegram buttons</p>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-xl p-6 text-white shadow-lg transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-2">
              <div className="text-green-100 text-sm font-medium">🌐 Web Clicks</div>
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
            <div className="text-4xl font-bold">{stats.totalWebClicks.toLocaleString()}</div>
            <p className="text-green-100 text-sm mt-2">Total clicks on Web buttons</p>
          </div>
        </div>
        
        {/* Traffic Chart */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Traffic Last 7 Days</h2>
          <TrafficChart data={stats.dailyStats} />
        </div>
        
        {/* Top Links */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top Links</h2>
          {stats.topLinks.length > 0 ? (
            <div className="space-y-4">
              {stats.topLinks.map((link, index) => (
                <div 
                  key={link.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">/{link.slug}</p>
                      <p className="text-sm text-gray-600 truncate max-w-md">{link.video_url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{link.visit_count}</p>
                    <p className="text-sm text-gray-600">visits</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No links yet</p>
          )}
        </div>
      </main>
    </div>
  );
}

