import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import DashboardWithAnalytics from './DashboardWithAnalytics';

export const dynamic = 'force-dynamic';

async function getDashboardStats(userId: string) {
  const supabase = await createClient();
  
  // Get total links
  const { count: totalLinks } = await supabase
    .from('links')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Get all links with button clicks
  const { data: links } = await supabase
    .from('links')
    .select('id, slug, video_url, telegram_clicks, web_clicks, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  // Calculate total button clicks
  const totalTelegramClicks = links?.reduce((sum, link) => sum + (link.telegram_clicks || 0), 0) || 0;
  const totalWebClicks = links?.reduce((sum, link) => sum + (link.web_clicks || 0), 0) || 0;
  const totalClicks = totalTelegramClicks + totalWebClicks;
  
  // Get top links by total clicks (telegram + web)
  const topLinks = (links || [])
    .map(link => ({
      ...link,
      total_clicks: (link.telegram_clicks || 0) + (link.web_clicks || 0)
    }))
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .slice(0, 5);
  
  return {
    totalLinks: totalLinks || 0,
    totalClicks,
    totalTelegramClicks,
    totalWebClicks,
    topLinks,
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
        
        <DashboardWithAnalytics
          totalLinks={stats.totalLinks}
          totalClicks={stats.totalClicks}
          totalTelegramClicks={stats.totalTelegramClicks}
          totalWebClicks={stats.totalWebClicks}
          topLinks={stats.topLinks}
        />
      </main>
    </div>
  );
}

