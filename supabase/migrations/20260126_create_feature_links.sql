-- Migration: Create feature_links table for global feature links
CREATE TABLE IF NOT EXISTS feature_links (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key text NOT NULL UNIQUE,
  video text,
  image text,
  page text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
