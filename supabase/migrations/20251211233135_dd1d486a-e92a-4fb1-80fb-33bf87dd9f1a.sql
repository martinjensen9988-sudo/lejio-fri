-- Create enum for payment gateways
CREATE TYPE public.payment_gateway_type AS ENUM ('stripe', 'quickpay', 'pensopay', 'reepay', 'onpay');

-- Create enum for payment schedule
CREATE TYPE public.payment_schedule_type AS ENUM ('upfront', 'monthly');

-- Create payment_methods table to store customer payment methods (cards on file)
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  lessor_id UUID NOT NULL,
  gateway payment_gateway_type NOT NULL,
  gateway_payment_method_id TEXT NOT NULL,
  card_last_four TEXT,
  card_brand TEXT,
  card_expiry_month INTEGER,
  card_expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table for recurring payments
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  renter_id UUID,
  lessor_id UUID NOT NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  gateway payment_gateway_type NOT NULL,
  gateway_subscription_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  interval TEXT NOT NULL DEFAULT 'month',
  status TEXT NOT NULL DEFAULT 'pending',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  next_payment_date TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_transactions table to log all payments
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id),
  subscription_id UUID REFERENCES public.subscriptions(id),
  lessor_id UUID NOT NULL,
  renter_id UUID,
  gateway payment_gateway_type NOT NULL,
  gateway_transaction_id TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'DKK',
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'payment',
  description TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add payment schedule to vehicles table
ALTER TABLE public.vehicles ADD COLUMN payment_schedule payment_schedule_type DEFAULT 'upfront';

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Lessors can view payment methods for their customers"
ON public.payment_methods FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert payment methods"
ON public.payment_methods FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update payment methods"
ON public.payment_methods FOR UPDATE
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can delete payment methods"
ON public.payment_methods FOR DELETE
USING (auth.uid() = lessor_id);

CREATE POLICY "Customers can view their own payment methods"
ON public.payment_methods FOR SELECT
USING (auth.uid() = customer_id);

-- RLS Policies for subscriptions
CREATE POLICY "Lessors can view their subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert subscriptions"
ON public.subscriptions FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Lessors can update their subscriptions"
ON public.subscriptions FOR UPDATE
USING (auth.uid() = lessor_id);

CREATE POLICY "Renters can view their subscriptions"
ON public.subscriptions FOR SELECT
USING (auth.uid() = renter_id);

-- RLS Policies for payment_transactions
CREATE POLICY "Lessors can view their transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = lessor_id);

CREATE POLICY "Lessors can insert transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = lessor_id);

CREATE POLICY "Renters can view their transactions"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = renter_id);

-- Create updated_at triggers
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();