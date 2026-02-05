-- Create fleet_api_keys table for external API access
CREATE TABLE public.fleet_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fleet_owner_id UUID NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Default API Key',
  allowed_origins TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  requests_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE public.fleet_api_keys IS 'API keys for fleet owners to expose data to external websites';
COMMENT ON COLUMN public.fleet_api_keys.api_key IS 'The secret API key (hashed prefix for lookup)';
COMMENT ON COLUMN public.fleet_api_keys.allowed_origins IS 'CORS allowed origins for this key';

-- Enable RLS
ALTER TABLE public.fleet_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy: Fleet owners can view their own API keys
CREATE POLICY "Fleet owners can view their own API keys"
ON public.fleet_api_keys
FOR SELECT
USING (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can create their own API keys
CREATE POLICY "Fleet owners can create their own API keys"
ON public.fleet_api_keys
FOR INSERT
WITH CHECK (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can update their own API keys
CREATE POLICY "Fleet owners can update their own API keys"
ON public.fleet_api_keys
FOR UPDATE
USING (auth.uid() = fleet_owner_id);

-- Policy: Fleet owners can delete their own API keys
CREATE POLICY "Fleet owners can delete their own API keys"
ON public.fleet_api_keys
FOR DELETE
USING (auth.uid() = fleet_owner_id);

-- Create index for fast API key lookup
CREATE INDEX idx_fleet_api_keys_api_key ON public.fleet_api_keys(api_key) WHERE is_active = true;
CREATE INDEX idx_fleet_api_keys_owner ON public.fleet_api_keys(fleet_owner_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fleet_api_keys_updated_at
BEFORE UPDATE ON public.fleet_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate secure API key
CREATE OR REPLACE FUNCTION public.generate_fleet_api_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_prefix TEXT := 'flk_';
  random_part TEXT;
BEGIN
  -- Generate 32 character random string
  SELECT encode(gen_random_bytes(24), 'base64') INTO random_part;
  -- Remove special characters and return
  RETURN key_prefix || replace(replace(random_part, '+', ''), '/', '');
END;
$$;