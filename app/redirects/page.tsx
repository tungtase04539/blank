import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import RedirectsList from './RedirectsList';

export const dynamic = 'force-dynamic';

async function getRedirectUrls(userId: string) {
  const supabase = await createClient();
  
  const { data: urls } = await supabase
    .from('redirect_urls')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return urls || [];
}

export default async function RedirectsPage() {
  const user = await requireAuth();
  const redirectUrls = await getRedirectUrls(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Redirect URLs Management</h1>
          <p className="text-gray-600 mt-2">Configure URL list for smart redirect (2 times/5 minutes)</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Smart Redirect Rules:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Each IP will be redirected <strong>maximum 2 times</strong></li>
            <li>• 1st time: Redirect to first URL in list</li>
            <li>• 2nd time: Redirect to different URL (not same as 1st)</li>
            <li>• After 2 times: IP gets <strong>5 minute break</strong> from redirects</li>
            <li>• Applied to all links with redirect enabled</li>
          </ul>
        </div>
        
        <RedirectsList urls={redirectUrls} userId={user.id} />
      </main>
    </div>
  );
}

