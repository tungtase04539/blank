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

  console.log('🔍 LOGIN ATTEMPT:', { email });

  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  console.log('📊 USER QUERY:', { 
    found: !!user, 
    error: error?.message,
    userExists: user ? 'YES' : 'NO'
  });

  if (error || !user) {
    console.log('❌ USER NOT FOUND IN DB');
    return { success: false, error: 'Invalid credentials' };
  }

  // Verify password
  console.log('🔐 CHECKING PASSWORD...');
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  console.log('🔐 PASSWORD VALID:', isValidPassword);
  
  if (!isValidPassword) {
    console.log('❌ PASSWORD MISMATCH');
    return { success: false, error: 'Invalid credentials' };
  }

  // Create session using Supabase Auth
  // Try to sign in first
  console.log('🔑 TRYING AUTH SIGNIN...');
  let authResult = await supabase.auth.signInWithPassword({
    email,
    password: user.id,
  });

  console.log('🔑 AUTH SIGNIN RESULT:', { 
    success: !authResult.error,
    error: authResult.error?.message 
  });

  // If user doesn't exist in Auth, create them with auto-confirm
  if (authResult.error) {
    console.log('📝 USER NOT IN AUTH.USERS, CREATING...');
    const signUpResult = await supabase.auth.signUp({
      email,
      password: user.id,
      options: {
        emailRedirectTo: undefined,
        data: {
          email_confirmed: true
        }
      }
    });

    console.log('📝 SIGNUP RESULT:', { 
      success: !signUpResult.error,
      error: signUpResult.error?.message 
    });

    if (signUpResult.error) {
      console.error('❌ SignUp error:', signUpResult.error);
      return { success: false, error: 'Authentication failed: ' + signUpResult.error.message };
    }

    // Try to sign in again after signup
    console.log('🔑 RETRYING SIGNIN AFTER SIGNUP...');
    authResult = await supabase.auth.signInWithPassword({
      email,
      password: user.id,
    });

    console.log('🔑 RETRY RESULT:', { 
      success: !authResult.error,
      error: authResult.error?.message 
    });

    if (authResult.error) {
      console.error('❌ SignIn error after signup:', authResult.error);
      return { success: false, error: 'Authentication failed: ' + authResult.error.message };
    }
  }

  console.log('✅ LOGIN SUCCESS!');
  return { success: true, user };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

