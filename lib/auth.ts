import { createClient } from '@/lib/supabase/server';
import bcrypt from 'bcryptjs';

export async function getSession() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getUserFromSession() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('email', session.user.email)
    .single();

  return user;
}

export async function requireAuth() {
  const user = await getUserFromSession();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new Error('Forbidden: Admin access required');
  }
  return user;
}

export async function login(email: string, password: string) {
  const supabase = await createClient();

  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return { success: false, error: 'Invalid credentials' };
  }

  // Create session using Supabase Auth
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: user.id, // Use user ID as password for Supabase Auth
  });

  if (signInError) {
    // If user doesn't exist in Auth, create them
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password: user.id,
    });

    if (signUpError) {
      return { success: false, error: 'Authentication failed' };
    }

    // Sign in again
    await supabase.auth.signInWithPassword({
      email,
      password: user.id,
    });
  }

  return { success: true, user };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

