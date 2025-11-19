import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';

async function getMonthlyStats(userId: string) {
  const supabase = await createClient();
  
  // Get all user's links
  const { data: links } = await supabase
    .from('links')
    .select('id, slug')
    .eq('user_id', userId);
  
  const linkIds = links?.map(l => l.id) || [];
  
  // Get current month date range
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  // Query from daily_stats table (the correct table!)
  const statsPromises = (links || []).map(async (link) => {
    const { data: dailyData } = await supabase
      .from('daily_stats')
      .select('view_count')
      .eq('link_id', link.id)
      .gte('date', monthStart.toISOString().split('T')[0])
      .lte('date', monthEnd.toISOString().split('T')[0]);
    
    const totalViews = dailyData?.reduce((sum, day) => sum + (day.view_count || 0), 0) || 0;
    
    return {
      slug: link.slug,
      visits: totalViews,
    };
  });
  
  const linkStats = await Promise.all(statsPromises);
  linkStats.sort((a, b) => b.visits - a.visits);
  
  // Calculate total visits from all links
  const totalVisits = linkStats.reduce((sum, link) => sum + link.visits, 0);
  
  return {
    linkStats,
    totalVisits,
    month: format(now, 'MM/yyyy'),
  };
}

export default async function StatisticsPage() {
  const user = await requireAuth();
  const stats = await getMonthlyStats(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Thống Kê Traffic</h1>
          <p className="text-gray-600 mt-2">Xem chi tiết traffic tháng {stats.month}</p>
        </div>
        
        {/* Monthly Summary */}
        <div className="card mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Tổng Traffic Tháng {stats.month}</p>
              <p className="text-5xl font-bold mt-2">{stats.totalVisits.toLocaleString()}</p>
              <p className="text-indigo-100 text-sm mt-2">lượt truy cập</p>
            </div>
            <div className="text-8xl opacity-20">📊</div>
          </div>
        </div>
        
        {/* Link Statistics Table */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Chi Tiết Theo Link</h2>
          
          {stats.linkStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Link</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Lượt Truy Cập</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">% Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.linkStats.map((link, index) => {
                    const percentage = stats.totalVisits > 0 
                      ? ((link.visits / stats.totalVisits) * 100).toFixed(1)
                      : '0.0';
                    
                    return (
                      <tr key={link.slug} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-gray-600">{index + 1}</td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">/{link.slug}</span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className="text-xl font-bold text-gray-900">
                            {link.visits.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 w-12 text-right">
                              {percentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Chưa có dữ liệu traffic trong tháng này</p>
          )}
        </div>
      </main>
    </div>
  );
}

