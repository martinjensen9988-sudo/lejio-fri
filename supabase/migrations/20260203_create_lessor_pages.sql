-- Migration: Create lessor_pages and page_blocks tables for PageBuilder
-- Enables lessors to create custom website pages using drag-and-drop builder

CREATE TABLE lessor_pages (
  id BIGSERIAL PRIMARY KEY,
  lessor_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lessor_id, slug)
);

-- Page blocks for lessor_pages (stores individual blocks/sections)
CREATE TABLE page_blocks (
  id BIGSERIAL PRIMARY KEY,
  page_id BIGINT NOT NULL REFERENCES lessor_pages(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL, -- hero, features, pricing, cta, gallery, contact, etc.
  position INT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}', -- Stores block-specific configuration
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_lessor_pages_lessor_id ON lessor_pages(lessor_id);
CREATE INDEX idx_lessor_pages_slug ON lessor_pages(slug);
CREATE INDEX idx_lessor_pages_published ON lessor_pages(is_published);
CREATE INDEX idx_page_blocks_page_id ON page_blocks(page_id);
CREATE INDEX idx_page_blocks_position ON page_blocks(page_id, position);
