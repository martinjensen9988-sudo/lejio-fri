-- Drop existing restrictive policies and create simpler ones for admins
DROP POLICY IF EXISTS "Messages access for admins only" ON public.visitor_chat_messages;
DROP POLICY IF EXISTS "Super admins can view all messages" ON public.visitor_chat_messages;
DROP POLICY IF EXISTS "Super admins can manage messages" ON public.visitor_chat_messages;

-- Create a single comprehensive policy for admin access to messages
CREATE POLICY "Admins can read all messages" 
ON public.visitor_chat_messages 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow admins to insert messages (for replying)
CREATE POLICY "Admins can insert messages" 
ON public.visitor_chat_messages 
FOR INSERT 
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Ensure anonymous/visitor inserts still work
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON public.visitor_chat_messages;
CREATE POLICY "Public can insert chat messages" 
ON public.visitor_chat_messages 
FOR INSERT 
WITH CHECK (true);