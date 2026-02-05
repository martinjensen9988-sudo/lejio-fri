-- Create live chat settings table
CREATE TABLE public.live_chat_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_live_chat_active boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.live_chat_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO public.live_chat_settings (id, is_live_chat_active) 
VALUES ('00000000-0000-0000-0000-000000000001', false);

-- Create policies
CREATE POLICY "Anyone can view live chat settings" 
ON public.live_chat_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can update live chat settings" 
ON public.live_chat_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create visitor chat sessions table
CREATE TABLE public.visitor_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_name text,
  visitor_email text,
  visitor_phone text,
  session_status text NOT NULL DEFAULT 'ai_chat',
  needs_human_support boolean NOT NULL DEFAULT false,
  assigned_admin_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create/view their own sessions (using session ID stored in localStorage)
CREATE POLICY "Anyone can create chat sessions" 
ON public.visitor_chat_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view their session by ID" 
ON public.visitor_chat_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can view all sessions" 
ON public.visitor_chat_sessions 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Sessions can update themselves" 
ON public.visitor_chat_sessions 
FOR UPDATE 
USING (true);

-- Create visitor chat messages table
CREATE TABLE public.visitor_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.visitor_chat_sessions(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visitor_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages" 
ON public.visitor_chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view messages" 
ON public.visitor_chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Super admins can manage messages" 
ON public.visitor_chat_messages 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Create contact form submissions table
CREATE TABLE public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  responded_at timestamp with time zone,
  responded_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create contact submissions" 
ON public.contact_submissions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Super admins can manage contact submissions" 
ON public.contact_submissions 
FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.visitor_chat_sessions;