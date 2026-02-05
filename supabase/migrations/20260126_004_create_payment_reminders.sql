-- Create payment_reminders table for dunning management
CREATE TABLE IF NOT EXISTS public.payment_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  reminder_number INTEGER DEFAULT 1, -- 1st, 2nd, 3rd reminder
  reminder_type TEXT NOT NULL DEFAULT 'due_date', -- due_date, overdue_1, overdue_2, overdue_3, final_notice
  scheduled_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, cancelled
  email_subject TEXT,
  email_body TEXT,
  recipient_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT payment_reminders_type_check CHECK (reminder_type IN ('due_date', 'overdue_1', 'overdue_2', 'overdue_3', 'final_notice')),
  CONSTRAINT payment_reminders_status_check CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

-- Enable RLS
ALTER TABLE public.payment_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Admins can create reminders" ON public.payment_reminders;
DROP POLICY IF EXISTS "Admins can update reminders" ON public.payment_reminders;

-- Admins can manage reminders
CREATE POLICY "Admins can view reminders"
ON public.payment_reminders FOR SELECT
USING (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can create reminders"
ON public.payment_reminders FOR INSERT
WITH CHECK (public.has_any_admin_role(auth.uid()));

CREATE POLICY "Admins can update reminders"
ON public.payment_reminders FOR UPDATE
USING (public.has_any_admin_role(auth.uid()))
WITH CHECK (public.has_any_admin_role(auth.uid()));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice_id ON public.payment_reminders(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON public.payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled_date ON public.payment_reminders(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at ON public.payment_reminders(sent_at);
