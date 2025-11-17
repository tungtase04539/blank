import { requireAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import CreateLinkForm from './CreateLinkForm';

export default async function CreateLinkPage() {
  const user = await requireAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Link</h1>
          <p className="text-gray-600 mt-2">Create a quick link for your video</p>
        </div>
        
        <div className="card">
          <CreateLinkForm userId={user.id} />
        </div>
      </main>
    </div>
  );
}

