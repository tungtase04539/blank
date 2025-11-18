import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import DashboardHybrid from './DashboardHybrid';

export const dynamic = 'force-dynamic';

async function getDashboardStats(userId: string) {
  const supabase = await createClient();
  
  // Get link stats from the view (includes total_views and online_count)
  const { data: links } = await supabase
    .from('link_stats')
    .select('*')
    .eq('user_id', userId)
    .order('total_views', { ascending: false });
  
  // Calculate total views and online count
  const totalViews = links?.reduce((sum, link) => sum + (link.total_views || 0), 0) || 0;
  
  // Get total online count using database function
  const { data: onlineData } = await supabase.rpc('get_total_online_count');
  const totalOnline = onlineData || 0;
  
  // Get last 7 days chart data
  const { data: chartData } = await supabase
    .from('last_7_days_stats')
    .select('*')
    .order('date', { ascending: true });
  
  // Format chart data
  const formattedChartData = (chartData || []).map(row => ({
    date: row.date,
    visits: row.total_views || 0,
  }));
  
  return {
    links: links || [],
    totalViews,
    totalOnline,
    chartData: formattedChartData,
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
        
        <DashboardHybrid
          initialLinks={stats.links}
          chartData={stats.chartData}
          totalViews={stats.totalViews}
          totalOnline={stats.totalOnline}
        />
      </main>
    </div>
  );
}
