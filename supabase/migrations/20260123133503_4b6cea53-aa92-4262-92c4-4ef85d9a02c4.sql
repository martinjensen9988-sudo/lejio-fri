-- Create audit log table
CREATE TABLE public.admin_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', 'swap', etc.
  entity_type TEXT NOT NULL, -- 'profile', 'booking', 'vehicle', 'invoice', 'vehicle_swap', etc.
  entity_id UUID, -- The ID of the affected entity (nullable for bulk actions)
  entity_identifier TEXT, -- Human-readable identifier (email, registration, invoice number)
  old_values JSONB, -- Previous values (for updates)
  new_values JSONB, -- New values (for creates/updates)
  description TEXT NOT NULL, -- Human-readable description of the action
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_audit_logs_admin_user ON public.admin_audit_logs(admin_user_id);
CREATE INDEX idx_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action_type ON public.admin_audit_logs(action_type);

-- Enable RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view audit logs
CREATE POLICY "Super admins can view all audit logs"
  ON public.admin_audit_logs
  FOR SELECT
  USING (public.has_role(auth.uid(), 'super_admin'));

-- All admin roles can insert audit logs (for their own actions)
CREATE POLICY "Admins can create audit logs"
  ON public.admin_audit_logs
  FOR INSERT
  WITH CHECK (public.has_any_admin_role(auth.uid()) AND admin_user_id = auth.uid());

-- No one can update or delete audit logs (immutable)
-- (No UPDATE or DELETE policies = not allowed)

-- Add comment for documentation
COMMENT ON TABLE public.admin_audit_logs IS 'Immutable audit trail of all admin actions in the system. Only super_admin can read.';