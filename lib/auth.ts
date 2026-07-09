import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  // Đọc bảng users bằng service_role (RLS đã chặn anon đọc password_hash)
  const { data: user } = await createAdminClient()
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

  console.log('🔐 Login attempt for:', email);

  // Get user from database bằng service_role (RLS chặn anon đọc users)
  const { data: user, error } = await createAdminClient()
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    console.log('❌ User not found in database:', error?.message);
    return { success: false, error: 'Invalid credentials' };
  }

  console.log('✅ User found in database:', user.email);
  console.log('🔍 Password hash in DB:', user.password_hash);
  console.log('🔍 Password provided:', password);

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('🔍 bcrypt.compare result:', isValidPassword);
  
  // TEMPORARY: Also check if password matches plaintext (for debugging)
  if (!isValidPassword && user.password_hash === password) {
    console.log('⚠️ Password matches plaintext - using plaintext auth temporarily');
    // Continue with plaintext match for now
  } else if (!isValidPassword) {
    console.log('❌ Invalid password - bcrypt failed and no plaintext match');
    return { success: false, error: 'Invalid credentials' };
  }

  console.log('✅ Password verified');

  // Create session using Supabase Auth
  // Try to sign in first
  console.log('🔑 Attempting Supabase Auth signIn...');
  let authResult = await supabase.auth.signInWithPassword({
    email,
    password: user.id,
  });

  // If user doesn't exist in Auth, create them using admin API
  if (authResult.error?.message?.includes('Invalid login credentials') || 
      authResult.error?.message?.includes('Email not confirmed')) {
    console.log('⚠️ User not in auth.users, creating with admin API...');
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
        console.error('❌ Admin createUser error:', adminError);
        return { success: false, error: 'Failed to create auth session: ' + adminError.message };
      }

      console.log('✅ User created in auth.users with admin API');

      // Now try to sign in again
      console.log('🔑 Attempting signIn after admin creation...');
      authResult = await supabase.auth.signInWithPassword({
        email,
        password: user.id,
      });

      if (authResult.error) {
        console.error('❌ SignIn error after admin creation:', authResult.error);
        return { success: false, error: 'Login failed: ' + authResult.error.message };
      }
      
      console.log('✅ SignIn successful after admin creation');
    } catch (err: any) {
      console.error('❌ Exception during admin user creation:', err);
      return { success: false, error: 'Authentication error: ' + err.message };
    }
  } else if (authResult.error) {
    console.error('❌ SignIn error:', authResult.error);
    return { success: false, error: authResult.error.message };
  } else {
    console.log('✅ SignIn successful on first attempt');
  }

  console.log('🎉 Login successful for:', email);
  return { success: true, user };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

