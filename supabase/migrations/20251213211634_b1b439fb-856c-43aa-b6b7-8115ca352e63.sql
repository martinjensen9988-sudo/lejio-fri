-- Fix RLS policies for visitor_chat_sessions to allow anonymous users to create sessions
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Public can create sessions" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Sessions can be created by anyone" ON public.visitor_chat_sessions;

-- Allow anyone (including anonymous users) to create chat sessions
CREATE POLICY "Anyone can create chat sessions" 
ON public.visitor_chat_sessions 
FOR INSERT 
WITH CHECK (true);

-- Allow anyone to update their session (for visitor info updates)
DROP POLICY IF EXISTS "Anyone can update their session" ON public.visitor_chat_sessions;
CREATE POLICY "Anyone can update sessions" 
ON public.visitor_chat_sessions 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Ensure admins can still read all sessions
DROP POLICY IF EXISTS "Admins can read all sessions" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Super admins can read all sessions" ON public.visitor_chat_sessions;
CREATE POLICY "Admins can read all sessions" 
ON public.visitor_chat_sessions 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- Allow visitors to read their own session via RPC function (already exists)
-- But also add a public SELECT for sessions to enable realtime subscriptions
DROP POLICY IF EXISTS "Public can read sessions" ON public.visitor_chat_sessions;
CREATE POLICY "Public can read sessions" 
ON public.visitor_chat_sessions 
FOR SELECT 
USING (true);

-- Also ensure visitor_chat_messages allows public INSERT
DROP POLICY IF EXISTS "Public can insert chat messages" ON public.visitor_chat_messages;
CREATE POLICY "Public can insert chat messages" 
ON public.visitor_chat_messages 
FOR INSERT 
WITH CHECK (true);

-- Allow public to read their messages (for realtime)
DROP POLICY IF EXISTS "Public can read messages" ON public.visitor_chat_messages;
CREATE POLICY "Public can read messages" 
ON public.visitor_chat_messages 
FOR SELECT 
USING (true);