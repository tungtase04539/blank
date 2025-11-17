import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import ScriptsList from './ScriptsList';

export const dynamic = 'force-dynamic';

async function getScripts(userId: string) {
  const supabase = await createClient();
  
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  return scripts || [];
}

export default async function ScriptsPage() {
  const user = await requireAuth();
  const scripts = await getScripts(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Scripts</h1>
            <p className="text-gray-600 mt-2">Add scripts automatically to all links</p>
          </div>
          <Link href="/scripts/create" className="btn btn-primary">
            + Add Script
          </Link>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> All enabled scripts will automatically apply to all your links.
            You can add multiple scripts for both head and body.
          </p>
        </div>
        
        <ScriptsList scripts={scripts} />
      </main>
    </div>
  );
}

