-- Create facebook_posts table to track all Facebook posts
CREATE TABLE public.facebook_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  post_id TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  posted_by UUID NOT NULL,
  is_dagens_bil BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.facebook_posts ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage posts
CREATE POLICY "Admins can view all facebook posts" 
ON public.facebook_posts 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can insert facebook posts" 
ON public.facebook_posts 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can delete facebook posts" 
ON public.facebook_posts 
FOR DELETE 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create dagens_bil_settings table for auto-rotation settings
CREATE TABLE public.dagens_bil_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  auto_rotate BOOLEAN DEFAULT false,
  post_time TIME DEFAULT '09:00:00',
  last_posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dagens_bil_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can view dagens_bil_settings" 
ON public.dagens_bil_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can manage dagens_bil_settings" 
ON public.dagens_bil_settings 
FOR ALL 
USING (public.has_role(auth.uid(), 'super_admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_dagens_bil_settings_updated_at
BEFORE UPDATE ON public.dagens_bil_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();