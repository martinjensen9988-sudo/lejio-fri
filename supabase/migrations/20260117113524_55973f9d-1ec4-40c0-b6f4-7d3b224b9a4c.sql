-- Drop the tables if they were partially created
DROP TABLE IF EXISTS public.sales_emails CASCADE;
DROP TABLE IF EXISTS public.sales_leads CASCADE;

-- Create sales_leads table for storing potential customers
CREATE TABLE public.sales_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cvr_number TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  industry TEXT,
  website TEXT,
  facebook_url TEXT,
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create sales_emails table for tracking sent emails
CREATE TABLE public.sales_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.sales_leads(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_emails ENABLE ROW LEVEL SECURITY;

-- Admin-only policies using the existing has_any_admin_role function
CREATE POLICY "Admins can manage sales leads" 
ON public.sales_leads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'support')
  )
);

CREATE POLICY "Admins can manage sales emails" 
ON public.sales_emails 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin', 'support')
  )
);

-- Create indexes for performance
CREATE INDEX idx_sales_leads_status ON public.sales_leads(status);
CREATE INDEX idx_sales_leads_source ON public.sales_leads(source);
CREATE INDEX idx_sales_emails_lead_id ON public.sales_emails(lead_id);

-- Add trigger for updated_at
CREATE TRIGGER update_sales_leads_updated_at
BEFORE UPDATE ON public.sales_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();