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
  // Try to sign in first
  let authResult = await supabase.auth.signInWithPassword({
    email,
    password: user.id,
  });

  // If user doesn't exist in Auth, create them using admin API
  if (authResult.error?.message?.includes('Invalid login credentials')) {
    try {
      // Use service role to create user with confirmed email
      const { createClient: createServiceClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Create user in auth with admin API (bypasses email confirmation)
      const { data: newUser, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: user.id,
        email_confirm: true,
        user_metadata: {
          role: user.role
        }
      });

      if (adminError) {
        console.error('Admin createUser error:', adminError);
        return { success: false, error: 'Failed to create auth session: ' + adminError.message };
      }

      // Now try to sign in again
      authResult = await supabase.auth.signInWithPassword({
        email,
        password: user.id,
      });

      if (authResult.error) {
        console.error('SignIn error after admin creation:', authResult.error);
        return { success: false, error: 'Login failed: ' + authResult.error.message };
      }
    } catch (err: any) {
      console.error('Exception during admin user creation:', err);
      return { success: false, error: 'Authentication error: ' + err.message };
    }
  } else if (authResult.error) {
    console.error('SignIn error:', authResult.error);
    return { success: false, error: authResult.error.message };
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

