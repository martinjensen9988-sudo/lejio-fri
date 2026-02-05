-- Add polygon_coordinates column to geofences table for storing polygon points as GeoJSON
ALTER TABLE public.geofences 
ADD COLUMN IF NOT EXISTS polygon_coordinates JSONB DEFAULT NULL;

-- Add geofence_type column to distinguish between circle and polygon
ALTER TABLE public.geofences 
ADD COLUMN IF NOT EXISTS geofence_type TEXT NOT NULL DEFAULT 'circle' CHECK (geofence_type IN ('circle', 'polygon'));

-- Add comment to explain the polygon_coordinates format
COMMENT ON COLUMN public.geofences.polygon_coordinates IS 'GeoJSON coordinates array for polygon geofences. Format: [[lng1, lat1], [lng2, lat2], ...]. For circle geofences, this is NULL.';

-- Create index for faster polygon queries
CREATE INDEX IF NOT EXISTS idx_geofences_type ON public.geofences(geofence_type);