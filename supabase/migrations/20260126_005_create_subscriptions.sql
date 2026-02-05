-- Add missing policies to subscriptions table
DROP POLICY IF EXISTS "Renters can view their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Lessors can view subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "System can manage subscriptions" ON public.subscriptions;

CREATE POLICY "Renters can view their subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = renter_id);
CREATE POLICY "Lessors can view subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = lessor_id);
CREATE POLICY "System can manage subscriptions" ON public.subscriptions FOR ALL USING (public.has_any_admin_role(auth.uid())) WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_renter_id ON public.subscriptions(renter_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_lessor_id ON public.subscriptions(lessor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_vehicle_id ON public.subscriptions(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_created_at ON public.subscriptions(created_at DESC);
