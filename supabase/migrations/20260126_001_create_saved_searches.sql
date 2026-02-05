-- Create saved_searches table for CRM lead search filters
CREATE TABLE public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'lead', -- 'lead' or 'deal'
  name TEXT NOT NULL,
  description TEXT,
  criteria JSONB NOT NULL, -- Stores filter criteria as JSON
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_favorite BOOLEAN DEFAULT false,
  CONSTRAINT saved_searches_type_check CHECK (type IN ('lead', 'deal'))
);

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved searches
CREATE POLICY "Users can view own saved searches"
ON public.saved_searches
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create saved searches
CREATE POLICY "Users can create saved searches"
ON public.saved_searches
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
ON public.saved_searches
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
ON public.saved_searches
FOR DELETE
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_saved_searches_user_id ON public.saved_searches(user_id);
CREATE INDEX idx_saved_searches_type ON public.saved_searches(type);
CREATE INDEX idx_saved_searches_is_favorite ON public.saved_searches(is_favorite);
CREATE INDEX idx_saved_searches_created_at ON public.saved_searches(created_at DESC);
