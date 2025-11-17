'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface CreateUserData {
  email: string;
  password: string;
  role: 'user' | 'admin';
}

export async function createUserAction(data: CreateUserData) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existing) {
      return { success: false, error: 'Email đã được sử dụng' };
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const { error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password_hash: passwordHash,
        role: data.role,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Có lỗi xảy ra' };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    revalidatePath('/admin/users');
  } catch (error) {
    console.error('Error deleting user:', error);
  }
}

