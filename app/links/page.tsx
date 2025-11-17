import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import LinksList from './LinksList';

export const dynamic = 'force-dynamic';

async function getLinks(userId: string) {
  const supabase = await createClient();
  
  const { data: links } = await supabase
    .from('links')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  // Get visit counts for each link
  const linksWithCounts = await Promise.all(
    (links || []).map(async (link) => {
      const { count } = await supabase
        .from('link_visits')
        .select('*', { count: 'exact', head: true })
        .eq('link_id', link.id);
      
      return {
        ...link,
        visit_count: count || 0,
      };
    })
  );
  
  return linksWithCounts;
}

export default async function LinksPage() {
  const user = await requireAuth();
  const links = await getLinks(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Links</h1>
            <p className="text-gray-600 mt-2">Tạo và quản lý các link nhanh của bạn</p>
          </div>
          <Link href="/links/create" className="btn btn-primary">
            + Tạo Link Mới
          </Link>
        </div>
        
        <LinksList links={links} appUrl={process.env.NEXT_PUBLIC_APP_URL || ''} />
      </main>
    </div>
  );
}

