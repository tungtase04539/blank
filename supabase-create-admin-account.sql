-- Create new admin account for legendarytvst@gmail.com
-- Password: Anhtung1998

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert new admin user
INSERT INTO public.users (id, email, password_hash, role, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'legendarytvst@gmail.com',
  crypt('Anhtung1998', gen_salt('bf')), -- bcrypt hash
  'admin',
  now(),
  now()
)
ON CONFLICT (email) 
DO UPDATE SET
  password_hash = crypt('Anhtung1998', gen_salt('bf')),
  role = 'admin',
  updated_at = now();

-- Verify the account was created
SELECT id, email, role, created_at 
FROM public.users 
WHERE email = 'legendarytvst@gmail.com';

