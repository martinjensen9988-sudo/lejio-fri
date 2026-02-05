-- Create invoices table for invoice management
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, viewed, partially_paid, paid, overdue, cancelled
  amount_total DECIMAL(10, 2) NOT NULL,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'DKK',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  payment_method TEXT, -- credit_card, bank_transfer, mobilepay, cash
  accounting_code TEXT, -- For accounting integration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Lessors can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Renters can view their invoices" ON public.invoices;
DROP POLICY IF EXISTS "Admins can view all invoices" ON public.invoices;

-- Lessors can view their invoices
CREATE POLICY "Lessors can view their invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = lessor_id);

-- Renters can view their invoices
CREATE POLICY "Renters can view their invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = lessor_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
ON public.invoices FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_booking_id ON public.invoices(booking_id);
CREATE INDEX IF NOT EXISTS idx_invoices_lessor_id ON public.invoices(lessor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
