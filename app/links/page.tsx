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
  
  // Add total clicks (telegram + web) to each link
  const linksWithCounts = (links || []).map(link => ({
    ...link,
    visit_count: (link.telegram_clicks || 0) + (link.web_clicks || 0),
    online_count: 0, // Removed online tracking - using Google Analytics
  }));
  
  // Sort links
  if (sortBy === 'clicks') {
    linksWithCounts.sort((a, b) => b.visit_count - a.visit_count);
  } else if (sortBy === 'online') {
    // Online sort removed - fallback to created
    linksWithCounts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
            <h1 className="text-3xl font-bold text-gray-900">Links Management</h1>
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

