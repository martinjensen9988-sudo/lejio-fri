-- Create a persistent rate limiting table for edge functions
-- This replaces in-memory rate limiting that resets on cold starts

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL, -- IP address or user ID
  endpoint TEXT NOT NULL, -- Function name (e.g., 'live-chat-ai', 'analyze-vehicle-damage')
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(identifier, endpoint, window_start)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup 
ON public.rate_limits (identifier, endpoint, window_start);

-- Create index for cleanup of old records
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup 
ON public.rate_limits (window_start);

-- Enable RLS but allow service role to manage
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits (edge functions use service role)
-- No user-facing policies needed

-- Create a function to check and increment rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_max_requests INTEGER DEFAULT 30,
  p_window_minutes INTEGER DEFAULT 1
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_current_count INTEGER;
  v_window_seconds INTEGER;
BEGIN
  v_window_seconds := p_window_minutes * 60;
  -- Round to the nearest window start time
  v_window_start := date_trunc('minute', now()) - 
    (EXTRACT(MINUTE FROM now())::INTEGER % p_window_minutes) * INTERVAL '1 minute';
  
  -- Try to insert or update the rate limit record
  INSERT INTO public.rate_limits (identifier, endpoint, request_count, window_start, updated_at)
  VALUES (p_identifier, p_endpoint, 1, v_window_start, now())
  ON CONFLICT (identifier, endpoint, window_start) 
  DO UPDATE SET 
    request_count = rate_limits.request_count + 1,
    updated_at = now()
  RETURNING request_count INTO v_current_count;
  
  -- If no count returned, it was an insert
  IF v_current_count IS NULL THEN
    v_current_count := 1;
  END IF;
  
  -- Return the result
  RETURN QUERY SELECT 
    v_current_count <= p_max_requests AS allowed,
    v_current_count AS current_count,
    CASE 
      WHEN v_current_count > p_max_requests 
      THEN GREATEST(0, v_window_seconds - EXTRACT(EPOCH FROM (now() - v_window_start))::INTEGER)
      ELSE 0
    END AS retry_after_seconds;
END;
$$;

-- Grant execute to service role (edge functions)
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Create a cleanup function to remove old rate limit records (run via cron)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM public.rate_limits
  WHERE window_start < now() - INTERVAL '1 hour';
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limits() TO service_role;