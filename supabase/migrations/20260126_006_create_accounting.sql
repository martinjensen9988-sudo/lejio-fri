-- Create accounting_entries table for revenue recognition
CREATE TABLE IF NOT EXISTS public.accounting_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  lessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL DEFAULT 'invoice', -- invoice, payment, subscription, refund, adjustment
  account_code TEXT NOT NULL, -- GL account code for accounting system
  debit_amount DECIMAL(10, 2),
  credit_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'DKK',
  description TEXT NOT NULL,
  reference_number TEXT, -- Invoice number or reference
  posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  accounting_period TEXT, -- YYYY-MM format for period matching
  status TEXT NOT NULL DEFAULT 'draft', -- draft, posted, reconciled, cancelled
  external_id TEXT, -- ID from accounting system (Xero, Exact, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT accounting_entries_type_check CHECK (entry_type IN ('invoice', 'payment', 'subscription', 'refund', 'adjustment')),
  CONSTRAINT accounting_entries_status_check CHECK (status IN ('draft', 'posted', 'reconciled', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.accounting_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Lessors can view their entries" ON public.accounting_entries;
DROP POLICY IF EXISTS "Admins can view all entries" ON public.accounting_entries;
DROP POLICY IF EXISTS "System can manage entries" ON public.accounting_entries;
DROP POLICY IF EXISTS "Service role can manage entries" ON public.accounting_entries;

-- Lessors can view their entries
CREATE POLICY "Lessors can view their entries"
ON public.accounting_entries FOR SELECT
USING (auth.uid() = lessor_id);

-- Admins can view all entries
CREATE POLICY "Admins can view all entries"
ON public.accounting_entries FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

-- System can create/update entries
CREATE POLICY "System can manage entries"
ON public.accounting_entries FOR ALL
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Service role can manage entries (for webhooks/automation)
CREATE POLICY "Service role can manage entries"
ON public.accounting_entries FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role');

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_accounting_entries_invoice_id ON public.accounting_entries(invoice_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_subscription_id ON public.accounting_entries(subscription_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_lessor_id ON public.accounting_entries(lessor_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_entry_type ON public.accounting_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_status ON public.accounting_entries(status);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_posting_date ON public.accounting_entries(posting_date DESC);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_external_id ON public.accounting_entries(external_id);
