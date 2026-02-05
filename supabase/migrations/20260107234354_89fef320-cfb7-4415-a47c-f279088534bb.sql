-- Add session_token_hash column for secure token-based authentication
ALTER TABLE public.visitor_chat_sessions 
ADD COLUMN IF NOT EXISTS session_token_hash TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_visitor_chat_sessions_token_hash 
ON public.visitor_chat_sessions(session_token_hash);

-- Drop the insecure RPC functions that bypass RLS
DROP FUNCTION IF EXISTS public.get_visitor_chat_session(uuid);
DROP FUNCTION IF EXISTS public.get_visitor_chat_messages(uuid);