-- Allow admin roles (support/admin/super_admin) to manage bookings and vehicles

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='bookings' AND policyname='Admins can update all bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update all bookings" ON public.bookings FOR UPDATE USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='bookings' AND policyname='Admins can delete all bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete all bookings" ON public.bookings FOR DELETE USING (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='vehicles' AND policyname='Admins can delete all vehicles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete all vehicles" ON public.vehicles FOR DELETE USING (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='vehicles' AND policyname='Admins can update all vehicles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update all vehicles" ON public.vehicles FOR UPDATE USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()))';
  END IF;
END $$;
