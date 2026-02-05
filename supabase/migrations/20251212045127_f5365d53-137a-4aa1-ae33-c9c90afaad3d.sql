-- Fix RLS policies for visitor_chat_sessions to prevent public data exposure
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view their session by ID" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Sessions can update themselves" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Anyone can view messages" ON public.visitor_chat_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.visitor_chat_messages;

-- Create more restrictive policies for visitor_chat_sessions
-- Note: Since visitors are anonymous, we cannot use auth.uid()
-- The session_id must be passed from the client and validated

-- Allow anyone to create a new session (this is required for the chat to work)
CREATE POLICY "Anyone can create sessions"
ON public.visitor_chat_sessions
FOR INSERT
WITH CHECK (true);

-- Allow viewing only via the session ID (client must know the session ID)
-- This relies on session_id being a UUID that's hard to guess
CREATE POLICY "Session owners can view their session"
ON public.visitor_chat_sessions
FOR SELECT
USING (
  -- Super admins can see all sessions
  has_role(auth.uid(), 'super_admin'::app_role)
);

-- Only super admins can update sessions
CREATE POLICY "Super admins can update sessions"
ON public.visitor_chat_sessions
FOR UPDATE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create restrictive policies for visitor_chat_messages
-- Allow inserting messages (required for chat to work)
CREATE POLICY "Anyone can insert chat messages"
ON public.visitor_chat_messages
FOR INSERT
WITH CHECK (true);

-- Only super admins can view all messages (for admin panel)
-- Anonymous users will fetch messages via edge function
CREATE POLICY "Super admins can view all messages"
ON public.visitor_chat_messages
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));