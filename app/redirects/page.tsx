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

async function getTimedRedirectUrls(userId: string) {
  const supabase = await createClient();
  
  const { data: urls } = await supabase
    .from('timed_redirect_urls')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return urls || [];
}

async function getGlobalSettings(userId: string) {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return settings;
}

export default async function RedirectsPage() {
  const user = await requireAuth();
  const redirectUrls = await getRedirectUrls(user.id);
  const timedRedirectUrls = await getTimedRedirectUrls(user.id);
  const globalSettings = await getGlobalSettings(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Redirect URLs Management</h1>
          <p className="text-gray-600 mt-2">Configure URL list for random redirect, lucky settings, and timed redirect</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎲 Random Redirect:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• System randomly selects one URL from your list</li>
            <li>• Traffic is distributed evenly across all URLs</li>
            <li>• No tracking required - privacy friendly</li>
            <li>• Scalable to unlimited traffic</li>
            <li>• Applied to all links with redirect enabled</li>
          </ul>
        </div>
        
        <RedirectsList 
          urls={redirectUrls} 
          timedUrls={timedRedirectUrls}
          userId={user.id} 
          globalSettings={globalSettings} 
        />
      </main>
    </div>
  );
}


