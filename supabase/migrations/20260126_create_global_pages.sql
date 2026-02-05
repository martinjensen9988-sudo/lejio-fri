-- Migration: Create global_pages table for admin-editable content pages
CREATE TABLE global_pages (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content_markdown TEXT,
  image_urls TEXT[],
  video_urls TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup by slug
CREATE INDEX idx_global_pages_slug ON global_pages(slug);
