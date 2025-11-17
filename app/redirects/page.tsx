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
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Redirect URLs</h1>
          <p className="text-gray-600 mt-2">Cấu hình list URLs cho smart redirect (2 lần/5 phút)</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Smart Redirect Rules:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Mỗi IP chỉ bị redirect <strong>tối đa 2 lần</strong></li>
            <li>• Lần 1: Redirect đến URL đầu tiên trong list</li>
            <li>• Lần 2: Redirect đến URL khác (không trùng lần 1)</li>
            <li>• Sau 2 lần: IP được <strong>nghỉ 5 phút</strong> không bị redirect</li>
            <li>• Áp dụng cho tất cả links có bật redirect</li>
          </ul>
        </div>
        
        <RedirectsList urls={redirectUrls} userId={user.id} />
      </main>
    </div>
  );
}

