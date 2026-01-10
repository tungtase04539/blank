import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import DashboardHybrid from './DashboardHybrid';

// ✅ ISR: Revalidate every 10 minutes (tiết kiệm server renders)
export const revalidate = 600;

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

        {/* Info Banner - Cost Optimized */}
        <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                <strong>💰 Cost Optimized:</strong> Dashboard updates every 10 minutes to minimize server costs. 
                Use Google Analytics for real-time detailed traffic insights.
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
