import { redirect } from 'next/navigation';
import { getUserFromSession } from '@/lib/auth';

export default async function Home() {
  const user = await getUserFromSession();
  
  if (user) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}

