
-- Allow all admins to update profiles (not just super_admin)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (has_any_admin_role(auth.uid()))
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow all admins to update live_chat_settings (not just super_admin)
CREATE POLICY "Admins can update live chat settings" 
ON public.live_chat_settings 
FOR UPDATE 
TO authenticated
USING (has_any_admin_role(auth.uid()))
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow admins to insert chat messages (for responding to visitors)
CREATE POLICY "Admins can insert chat messages" 
ON public.visitor_chat_messages 
FOR INSERT 
TO authenticated
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow admins to update chat messages if needed
CREATE POLICY "Admins can update chat messages" 
ON public.visitor_chat_messages 
FOR UPDATE 
TO authenticated
USING (has_any_admin_role(auth.uid()))
WITH CHECK (has_any_admin_role(auth.uid()));

-- Allow admins to update visitor chat sessions (assign agents, change status)
CREATE POLICY "Admins can update all chat sessions" 
ON public.visitor_chat_sessions 
FOR UPDATE 
TO authenticated
USING (has_any_admin_role(auth.uid()))
WITH CHECK (has_any_admin_role(auth.uid()));
