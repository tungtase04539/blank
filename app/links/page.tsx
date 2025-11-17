import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LinksList from './LinksList';

export const dynamic = 'force-dynamic';

async function getLinks(userId: string, sortBy: string = 'created') {
  const supabase = await createClient();
  
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId);
  
  // Get visit counts and online count for each link
  const linksWithCounts = await Promise.all(
    (links || []).map(async (link) => {
      // Total visits
      const { count: visitCount } = await supabase
        .from('link_visits')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', link.id);
      
      // Online count (sessions active in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: onlineCount } = await supabase
        .from('online_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', link.id)
        .gte('last_active', thirtyMinutesAgo);
      
      return {
        ...link,
        visit_count: visitCount || 0,
        online_count: onlineCount || 0,
      };
    })
  );
  
  // Sort links
  if (sortBy === 'clicks') {
    linksWithCounts.sort((a, b) => b.visit_count - a.visit_count);
  } else if (sortBy === 'online') {
    linksWithCounts.sort((a, b) => b.online_count - a.online_count);
  } else {
    linksWithCounts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  
  return linksWithCounts;
}

export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const sortBy = params.sort || 'created';
  const links = await getLinks(user.id, sortBy);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Links</h1>
            <p className="text-gray-600 mt-2">Create and manage your quick links</p>
          </div>
          <Link href="/links/create" className="btn btn-primary">
            + Create New Link
          </Link>
        </div>
        
        <LinksList links={links} appUrl={process.env.NEXT_PUBLIC_APP_URL || ''} currentSort={sortBy} />
      </main>
    </div>
  );
}

