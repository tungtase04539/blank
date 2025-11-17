'use server';

import { login } from '@/lib/auth';

export async function loginAction(email: string, password: string) {
  return await login(email, password);
}

