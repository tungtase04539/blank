import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/auth';
import LoginForm from './LoginForm';

export default async function LoginPage() {
  const user = await getUserFromSession();
  
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Quick Link</h1>
          <p className="text-gray-600">Đăng nhập vào hệ thống</p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <LoginForm />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Tài khoản mặc định: admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  );
}

