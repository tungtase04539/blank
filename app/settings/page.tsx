import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

async function getGlobalSettings(userId: string) {
  const supabase = await createClient();
  
  const { data: settings } = await supabase
    .from('global_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  return settings;
}

export default async function SettingsPage() {
  const user = await requireAuth();
  const settings = await getGlobalSettings(user.id);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Global Settings</h1>
          <p className="text-gray-600 mt-2">Cấu hình buttons áp dụng cho tất cả links</p>
        </div>
        
        <div className="card">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              <strong>💡 Lưu ý:</strong> Buttons được cấu hình ở đây sẽ tự động áp dụng cho tất cả links. 
              Bạn cũng có thể override bằng cách cấu hình buttons riêng cho từng link khi tạo/sửa.
            </p>
          </div>
          
          <SettingsForm userId={user.id} initialSettings={settings} />
        </div>
      </main>
    </div>
  );
}

