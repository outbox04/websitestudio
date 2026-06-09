-- Run this after creating your first admin user in Supabase Auth.
-- Replace the email below with your admin login email.

update public.profiles
set
  role = 'admin',
  is_active = true,
  updated_at = now()
where email = 'admin@example.com';

-- Verify admin account.
select id, email, full_name, role, is_active, created_at
from public.profiles
where email = 'admin@example.com';
