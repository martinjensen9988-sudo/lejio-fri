-- Allow admins to read all bookings/vehicles/profiles/contracts for operational support

-- bookings: policy already added in previous migration, keep as-is.

-- vehicles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='vehicles' AND policyname='Admins can view all vehicles'
  ) THEN
    CREATE POLICY "Admins can view all vehicles"
    ON public.vehicles
    FOR SELECT
    USING (public.has_any_admin_role(auth.uid()));
  END IF;
END $$;

-- profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (public.has_any_admin_role(auth.uid()));
  END IF;
END $$;

-- contracts (needed so admins can open/sign/view contract flow from booking context)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='contracts' AND policyname='Admins can view all contracts'
  ) THEN
    CREATE POLICY "Admins can view all contracts"
    ON public.contracts
    FOR SELECT
    USING (public.has_any_admin_role(auth.uid()));
  END IF;
END $$;
