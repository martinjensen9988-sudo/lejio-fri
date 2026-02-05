-- Create cache table for fleet premium stats
CREATE TABLE public.fleet_premium_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fleet_premium_cache ENABLE ROW LEVEL SECURITY;

-- Admin-only read policy
CREATE POLICY "Admins can read fleet cache"
  ON public.fleet_premium_cache
  FOR SELECT
  USING (public.has_any_admin_role(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_fleet_premium_cache_key ON public.fleet_premium_cache(cache_key);
CREATE INDEX idx_fleet_premium_cache_expires ON public.fleet_premium_cache(expires_at);

-- Add comment
COMMENT ON TABLE public.fleet_premium_cache IS 'Cached fleet premium dashboard stats, updated 4 times daily';