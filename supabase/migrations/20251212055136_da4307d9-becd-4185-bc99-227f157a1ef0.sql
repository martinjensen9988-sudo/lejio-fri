-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Anyone can view their session by id" ON public.visitor_chat_sessions;
DROP POLICY IF EXISTS "Anyone can view messages in their session" ON public.visitor_chat_messages;

-- Create a more restrictive policy for visitor_chat_sessions
-- Sessions are identified by their UUID which acts as a bearer token
-- Users must provide the exact session_id to access it
-- This prevents enumeration attacks while still allowing session access
CREATE POLICY "Session access via session id only"
ON public.visitor_chat_sessions
FOR SELECT
USING (
  -- Admins can view all sessions
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);

-- For anonymous users, we need to allow access but only via RPC or specific query patterns
-- Since RLS can't validate query parameters, we use a function-based approach
CREATE OR REPLACE FUNCTION public.get_visitor_chat_session(session_id_param uuid)
RETURNS SETOF public.visitor_chat_sessions
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.visitor_chat_sessions WHERE id = session_id_param;
$$;

-- Create a similar function for messages
CREATE OR REPLACE FUNCTION public.get_visitor_chat_messages(session_id_param uuid)
RETURNS SETOF public.visitor_chat_messages
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.visitor_chat_messages WHERE session_id = session_id_param ORDER BY created_at ASC;
$$;

-- Update messages policy to only allow admin access via direct query
CREATE POLICY "Messages access for admins only"
ON public.visitor_chat_messages
FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'super_admin')
);