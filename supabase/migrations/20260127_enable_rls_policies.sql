-- Enable Row Level Security (RLS) for sensitive tables
-- This migration adds RLS policies to protect employee data, traffic fines, and personal information

-- 1. Corporate Accounts - Only admins can view/edit
ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_accounts_admin_only" 
  ON public.corporate_accounts
  USING (
    -- User must be an admin for this corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce
      WHERE ce.corporate_account_id = corporate_accounts.id
      AND ce.user_id = auth.uid()
      AND ce.is_admin = true
    )
  );

-- 2. Corporate Employees - Users can only see their own or admins can see all in their company
ALTER TABLE public.corporate_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_employees_own_or_admin" 
  ON public.corporate_employees
  USING (
    -- User can see themselves
    user_id = auth.uid()
    OR
    -- Or if user is admin in same corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce2
      WHERE ce2.corporate_account_id = corporate_employees.corporate_account_id
      AND ce2.user_id = auth.uid()
      AND ce2.is_admin = true
    )
  );

-- 3. Corporate Departments - Users can only see if they belong to corporate account
ALTER TABLE public.corporate_departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_departments_corporate_access" 
  ON public.corporate_departments
  USING (
    -- User is an employee in this corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce
      WHERE ce.corporate_account_id = corporate_departments.corporate_account_id
      AND ce.user_id = auth.uid()
    )
  );

-- 4. Corporate Fleet Vehicles - Access based on corporate account membership
ALTER TABLE public.corporate_fleet_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_fleet_vehicles_corporate_access" 
  ON public.corporate_fleet_vehicles
  USING (
    -- User is an employee in this corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce
      WHERE ce.corporate_account_id = corporate_fleet_vehicles.corporate_account_id
      AND ce.user_id = auth.uid()
    )
  );

-- 5. Corporate Bookings - Employees can see own bookings, admins can see all
ALTER TABLE public.corporate_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_bookings_own_or_admin" 
  ON public.corporate_bookings
  USING (
    -- Employee can see own bookings
    corporate_employee_id IN (
      SELECT id FROM public.corporate_employees ce
      WHERE ce.user_id = auth.uid()
    )
    OR
    -- Or if user is admin in same corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce
      WHERE ce.corporate_account_id = corporate_bookings.corporate_account_id
      AND ce.user_id = auth.uid()
      AND ce.is_admin = true
    )
  );

-- 6. Corporate Invoices - Accessible only to authorized users in corporate account
ALTER TABLE public.corporate_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "corporate_invoices_corporate_access" 
  ON public.corporate_invoices
  USING (
    -- User is an employee (especially admin) in this corporate account
    EXISTS (
      SELECT 1 FROM public.corporate_employees ce
      WHERE ce.corporate_account_id = corporate_invoices.corporate_account_id
      AND ce.user_id = auth.uid()
      AND (ce.is_admin = true OR ce.is_active = true)
    )
  );

-- 7. Enable RLS on traffic fine related tables
ALTER TABLE public.fines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fines_lessor_access" 
  ON public.fines
  USING (
    -- Lessor can see their own fines
    lessor_id = (
      SELECT id FROM public.profiles WHERE profiles.id = auth.uid()
    )
    OR
    -- Renter can see fines from their bookings
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = fines.booking_id
      AND b.renter_id = auth.uid()
    )
  );

-- 8. Profiles table - Users can only see their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self_access" 
  ON public.profiles
  USING (id = auth.uid());

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.corporate_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.corporate_employees TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.corporate_departments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.corporate_fleet_vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.corporate_bookings TO authenticated;
GRANT SELECT, UPDATE ON public.corporate_invoices TO authenticated;
GRANT SELECT ON public.fines TO authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
