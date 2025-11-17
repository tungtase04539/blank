import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import EditLinkForm from './EditLinkForm';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getLink(linkId: string, userId: string) {
  const supabase = await createClient();
  
  const { data: link } = await supabase
    .from('links')
    .select('*')
    .eq('id', linkId)
    .eq('user_id', userId)
    .single();
  
  return link;
}

export default async function EditLinkPage({ params }: PageProps) {
  const user = await requireAuth();
  const { id } = await params;
  const link = await getLink(id, user.id);
  
  if (!link) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh Sửa Link</h1>
          <p className="text-gray-600 mt-2">Cập nhật thông tin link của bạn</p>
        </div>
        
        <div className="card">
          <EditLinkForm link={link} />
        </div>
      </main>
    </div>
  );
}

