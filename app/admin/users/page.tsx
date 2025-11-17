import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import Navbar from '@/components/Navbar';
import UsersList from './UsersList';

export const dynamic = 'force-dynamic';

async function getUsers() {
  const supabase = await createClient();
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  return users || [];
}

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await getUsers();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-600 mt-2">Create and manage user accounts</p>
        </div>
        
        <UsersList users={users} currentUserId={user.id} />
      </main>
    </div>
  );
}

