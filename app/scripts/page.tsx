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
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Scripts</h1>
            <p className="text-gray-600 mt-2">Thêm scripts tự động vào tất cả các link</p>
          </div>
          <Link href="/scripts/create" className="btn btn-primary">
            + Thêm Script
          </Link>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-sm">
            <strong>Lưu ý:</strong> Tất cả scripts đã được bật sẽ tự động áp dụng cho toàn bộ links của bạn.
            Bạn có thể thêm nhiều scripts cho head và body.
          </p>
        </div>
        
        <ScriptsList scripts={scripts} />
      </main>
    </div>
  );
}

