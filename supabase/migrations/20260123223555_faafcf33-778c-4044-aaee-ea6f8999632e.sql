-- Create fleet_vehicle_loans table for tracking repair loans and installments
CREATE TABLE public.fleet_vehicle_loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessor_id UUID NOT NULL,
  description TEXT NOT NULL,
  original_amount NUMERIC(10,2) NOT NULL,
  remaining_balance NUMERIC(10,2) NOT NULL,
  monthly_installment NUMERIC(10,2) NOT NULL,
  setup_fee NUMERIC(10,2) DEFAULT 300,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  remaining_months INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid_off', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for loan payment history (gebyr-log)
CREATE TABLE public.fleet_loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.fleet_vehicle_loans(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT NOT NULL DEFAULT 'installment' CHECK (payment_type IN ('installment', 'setup_fee', 'extra_payment')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add availability tracking fields to vehicles table for guarantee calculation
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS days_available_this_year INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_availability_sync TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.fleet_vehicle_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fleet_loan_payments ENABLE ROW LEVEL SECURITY;

-- Policies for fleet_vehicle_loans
CREATE POLICY "Lessors can view their own loans" 
ON public.fleet_vehicle_loans FOR SELECT 
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can create loans for their vehicles" 
ON public.fleet_vehicle_loans FOR INSERT 
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their own loans" 
ON public.fleet_vehicle_loans FOR UPDATE 
USING (auth.uid() = lessor_id);

-- Policies for fleet_loan_payments
CREATE POLICY "Users can view payments for their loans" 
ON public.fleet_loan_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fleet_vehicle_loans 
    WHERE fleet_vehicle_loans.id = fleet_loan_payments.loan_id 
    AND fleet_vehicle_loans.lessor_id = auth.uid()
  )
);

CREATE POLICY "Users can create payments for their loans" 
ON public.fleet_loan_payments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fleet_vehicle_loans 
    WHERE fleet_vehicle_loans.id = fleet_loan_payments.loan_id 
    AND fleet_vehicle_loans.lessor_id = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_fleet_vehicle_loans_vehicle_id ON public.fleet_vehicle_loans(vehicle_id);
CREATE INDEX idx_fleet_vehicle_loans_lessor_id ON public.fleet_vehicle_loans(lessor_id);
CREATE INDEX idx_fleet_vehicle_loans_status ON public.fleet_vehicle_loans(status);
CREATE INDEX idx_fleet_loan_payments_loan_id ON public.fleet_loan_payments(loan_id);