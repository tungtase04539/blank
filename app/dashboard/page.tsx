import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import DashboardHybrid from './DashboardHybrid';

export const dynamic = 'force-dynamic';

async function getDashboardStats(userId: string) {
  const supabase = await createClient();
  
  // Get link stats from the view (includes total_views)
  const { data: links } = await supabase
    .from('link_stats')
    .select('*')
    .eq('user_id', userId)
    .order('total_views', { ascending: false });
  
  // Calculate total views
  const totalViews = links?.reduce((sum, link) => sum + (link.total_views || 0), 0) || 0;
  
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

        {/* Info Banner - Tracking Removed */}
        <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>📊 Analytics Notice:</strong> Internal tracking has been disabled to reduce costs. 
                Please use external analytics services (Google Analytics, Plausible, etc.) for detailed traffic insights. 
                Dashboard shows historical data only (no real-time updates).
              </p>
            </div>
          </div>
        </div>
        
        <DashboardHybrid
          initialLinks={stats.links}
          chartData={stats.chartData}
          totalViews={stats.totalViews}
        />
      </main>
    </div>
  );
}
