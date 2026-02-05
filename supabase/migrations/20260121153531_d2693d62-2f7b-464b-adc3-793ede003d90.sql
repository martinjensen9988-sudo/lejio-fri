-- Admin/support should be able to view and manage check-in/out records for any booking

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='check_in_out_records' AND policyname='Admins can view all check-in/out records'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all check-in/out records" ON public.check_in_out_records FOR SELECT USING (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='check_in_out_records' AND policyname='Admins can insert check-in/out records'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can insert check-in/out records" ON public.check_in_out_records FOR INSERT WITH CHECK (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='check_in_out_records' AND policyname='Admins can update check-in/out records'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update check-in/out records" ON public.check_in_out_records FOR UPDATE USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()))';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='check_in_out_records' AND policyname='Admins can delete check-in/out records'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can delete check-in/out records" ON public.check_in_out_records FOR DELETE USING (public.has_any_admin_role(auth.uid()))';
  END IF;
END $$;
