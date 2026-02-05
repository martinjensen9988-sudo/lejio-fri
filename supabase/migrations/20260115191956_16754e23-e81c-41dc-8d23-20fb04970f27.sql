-- Fix UPDATE policy for lessor_payment_settings - add WITH CHECK clause
DROP POLICY IF EXISTS "Lessors can update their own payment settings" ON public.lessor_payment_settings;

CREATE POLICY "Lessors can update their own payment settings"
  ON public.lessor_payment_settings FOR UPDATE
  USING (auth.uid() = lessor_id)
  WITH CHECK (auth.uid() = lessor_id);