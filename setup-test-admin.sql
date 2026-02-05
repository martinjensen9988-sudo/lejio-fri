-- SQL Script to setup test admin user
-- Run this in Supabase SQL editor

-- First, create a test admin user via auth.users (note: you need to do this via UI or API)
-- For now, we'll assume the user exists and just add the role

-- Step 1: Insert test admin user into public.users table
INSERT INTO public.users (
  id,
  email,
  user_type,
  full_name,
  phone_number,
  is_active,
  created_at,
  updated_at
) VALUES (
  'test-admin-id-12345', -- Replace with actual UUID from your auth.users
  'admin@lejio.dk',
  'admin',
  'Test Admin',
  '+4512345678',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  user_type = 'admin',
  updated_at = NOW();

-- Step 2: Grant admin role
INSERT INTO public.user_roles (
  user_id,
  role
) VALUES (
  'test-admin-id-12345',
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 3: Create test corporate account
INSERT INTO public.corporate_accounts (
  company_name,
  cvr_number,
  admin_id,
  subscription_tier,
  is_active,
  created_at,
  updated_at
) VALUES (
  'Test Virksomhed',
  '12345678',
  'test-admin-id-12345',
  'premium',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (cvr_number) DO UPDATE SET
  updated_at = NOW();

-- Step 4: Create test departments
INSERT INTO public.corporate_departments (
  corporate_account_id,
  name,
  code,
  manager_employee_id,
  monthly_budget,
  is_active,
  created_at,
  updated_at
) VALUES
(
  (SELECT id FROM public.corporate_accounts WHERE company_name = 'Test Virksomhed' LIMIT 1),
  'Salg',
  'SALES',
  NULL,
  50000,
  true,
  NOW(),
  NOW()
),
(
  (SELECT id FROM public.corporate_accounts WHERE company_name = 'Test Virksomhed' LIMIT 1),
  'Service',
  'SERVICE',
  NULL,
  30000,
  true,
  NOW(),
  NOW()
);

-- Step 5: Create test employees
INSERT INTO public.corporate_employees (
  corporate_account_id,
  department_id,
  employee_number,
  full_name,
  email,
  phone,
  is_admin,
  is_active,
  created_at,
  updated_at
) VALUES
(
  (SELECT id FROM public.corporate_accounts WHERE company_name = 'Test Virksomhed' LIMIT 1),
  (SELECT id FROM public.corporate_departments WHERE code = 'SALES' LIMIT 1),
  'EMP001',
  'John Petersen',
  'john@test.dk',
  '+4540123456',
  true,
  true,
  NOW(),
  NOW()
),
(
  (SELECT id FROM public.corporate_accounts WHERE company_name = 'Test Virksomhed' LIMIT 1),
  (SELECT id FROM public.corporate_departments WHERE code = 'SERVICE' LIMIT 1),
  'EMP002',
  'Anna Andersen',
  'anna@test.dk',
  '+4550234567',
  false,
  true,
  NOW(),
  NOW()
);

-- Done!
SELECT 'Test admin setup complete!' as status;
