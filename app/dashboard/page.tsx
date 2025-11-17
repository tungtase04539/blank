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
  
  // Get total visits
  const { data: links } = await supabase
    .from('links')
    .select('id')
    .eq('user_id', userId);
  
  const linkIds = links?.map(l => l.id) || [];
  
  const { count: totalVisits } = await supabase
    .from('link_visits')
    .select('*', { count: 'exact', head: true })
    .in('link_id', linkIds.length > 0 ? linkIds : ['']);
  
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
          <p className="text-gray-600 mt-2">Xem tổng quan về links và traffic của bạn</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Tổng Links</p>
                <p className="text-4xl font-bold mt-2">{stats.totalLinks}</p>
              </div>
              <div className="text-5xl opacity-20">🔗</div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Tổng Lượt Truy Cập</p>
                <p className="text-4xl font-bold mt-2">{stats.totalVisits}</p>
              </div>
              <div className="text-5xl opacity-20">📊</div>
            </div>
          </div>
          
          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">TB Truy Cập/Link</p>
                <p className="text-4xl font-bold mt-2">
                  {stats.totalLinks > 0 ? Math.round(stats.totalVisits / stats.totalLinks) : 0}
                </p>
              </div>
              <div className="text-5xl opacity-20">📈</div>
            </div>
          </div>
        </div>
        
        {/* Traffic Chart */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Traffic 7 Ngày Qua</h2>
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
                    <p className="text-sm text-gray-600">lượt truy cập</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có link nào</p>
          )}
        </div>
      </main>
    </div>
  );
}

