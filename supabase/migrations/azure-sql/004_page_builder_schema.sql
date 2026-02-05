-- ============================================================================
-- Lejio Fri - Page Builder Schema
-- Purpose: Enable lessors to create custom websites with drag-and-drop builder
-- ============================================================================

-- ============================================================================
-- 1. PAGES TABLE
-- ============================================================================

CREATE TABLE fri_pages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    lessor_id NVARCHAR(36) NOT NULL,
    slug NVARCHAR(255) NOT NULL,
    title NVARCHAR(255) NOT NULL,
    meta_description NVARCHAR(500),
    layout_json NVARCHAR(MAX),
    is_published BIT NOT NULL DEFAULT 0,
    published_at DATETIME2,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id),
    CONSTRAINT uq_page_slug UNIQUE (lessor_id, slug)
)

CREATE INDEX idx_fri_pages_lessor ON fri_pages(lessor_id)
CREATE INDEX idx_fri_pages_published ON fri_pages(lessor_id, is_published)
GO

-- ============================================================================
-- 2. PAGE BLOCKS TABLE
-- ============================================================================

CREATE TABLE fri_page_blocks (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    page_id UNIQUEIDENTIFIER NOT NULL,
    block_type NVARCHAR(50) NOT NULL,
    position INT NOT NULL,
    config NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (page_id) REFERENCES fri_pages(id) ON DELETE CASCADE
)

CREATE INDEX idx_fri_blocks_page ON fri_page_blocks(page_id)
CREATE INDEX idx_fri_blocks_type ON fri_page_blocks(block_type)
GO

-- ============================================================================
-- 3. PAGE TEMPLATES
-- ============================================================================

CREATE TABLE fri_page_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(500),
    category NVARCHAR(50),
    layout_json NVARCHAR(MAX) NOT NULL,
    preview_image_url NVARCHAR(MAX),
    is_public BIT DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE()
)

CREATE INDEX idx_fri_templates_category ON fri_page_templates(category)
GO

-- ============================================================================
-- 4. CUSTOM DOMAINS TABLE
-- ============================================================================

CREATE TABLE fri_custom_domains (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    lessor_id NVARCHAR(36) NOT NULL,
    domain NVARCHAR(255) UNIQUE NOT NULL,
    is_verified BIT NOT NULL DEFAULT 0,
    verification_token NVARCHAR(255),
    dns_verified_at DATETIME2,
    ssl_certificate_url NVARCHAR(MAX),
    created_at DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    FOREIGN KEY (lessor_id) REFERENCES fri_lessors(id)
)

CREATE INDEX idx_fri_domains_lessor ON fri_custom_domains(lessor_id)
CREATE INDEX idx_fri_domains_domain ON fri_custom_domains(domain)
GO

-- ============================================================================
-- 5. BLOCK TYPES REFERENCE (Documentation)
-- ============================================================================

CREATE TABLE fri_block_types (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(50) UNIQUE NOT NULL,
    display_name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    icon_name NVARCHAR(50),
    category NVARCHAR(50),
    default_config NVARCHAR(MAX),
    allowed_settings NVARCHAR(MAX)
)

INSERT INTO fri_block_types (name, display_name, description, icon_name, category, default_config)
VALUES
('hero', 'Hero Section', 'Large banner with headline and image', 'layout', 'layout', '{"title":"Welcome","subtitle":"Your subtitle here","cta_text":"Get Started","cta_link":"/booking","image_url":""}'),
('text', 'Text Block', 'Rich text content with formatting', 'type', 'content', '{"content":"<p>Your text here</p>","align":"left"}'),
('pricing', 'Pricing Table', 'Display pricing from system', 'dollar-sign', 'business', '{"show_monthly":true,"show_yearly":false}'),
('vehicles', 'Vehicle Showcase', 'Display available vehicles', 'car', 'business', '{"columns":3,"show_price":true,"show_availability":true}'),
('booking', 'Booking Widget', 'Interactive booking system', 'calendar', 'business', '{"show_availability":true,"color":"#3b82f6"}'),
('testimonial', 'Testimonials', 'Customer reviews carousel', 'star', 'social', '{"items_per_row":3,"auto_play":true}'),
('contact', 'Contact Form', 'Get customer inquiries', 'mail', 'forms', '{"email_to":"","show_phone":true,"show_message":true}'),
('image', 'Image Gallery', 'Photo gallery with lightbox', 'image', 'media', '{"columns":3,"lightbox":true}'),
('cta', 'Call-to-Action', 'Button or banner with action', 'arrow-right', 'layout', '{"text":"Click Here","link":"","style":"button","size":"large"}'),
('footer', 'Footer', 'Site footer with info', 'layout-bottom', 'layout', '{"show_phone":true,"show_email":true,"show_hours":true}')
GO

-- ============================================================================
-- 6. AUDIT LOG FOR PAGE CHANGES
-- ============================================================================

CREATE TRIGGER tr_audit_page_changes
ON fri_pages
AFTER INSERT, UPDATE
AS
BEGIN
    INSERT INTO fri_audit_logs (lessor_id, action, entity_type, entity_id, created_at)
    SELECT lessor_id, 'PAGE_UPDATE', 'PAGE', id, GETUTCDATE()
    FROM inserted
END
GO

PRINT 'Page Builder schema created successfully!'
PRINT '- fri_pages table with layout JSON'
PRINT '- fri_page_blocks for individual components'
PRINT '- fri_page_templates for pre-built layouts'
PRINT '- fri_custom_domains for custom domain management'
PRINT '- fri_block_types reference table with 10 block types'
