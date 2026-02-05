# Page Builder Implementation - Integration Guide

## Overview
Complete website builder system for Lejio Fri that allows lessors to create custom websites via drag-and-drop editor.

## Files Created

### 1. **Backend API** (`supabase/functions/page-builder-api/index.ts`)
- Deno-based edge function
- 10 CRUD endpoints:
  - `GET /api/pages` - List pages for lessor
  - `POST /api/pages` - Create new page
  - `GET /api/pages/:id` - Get page with blocks
  - `PUT /api/pages/:id` - Update page metadata
  - `DELETE /api/pages/:id` - Delete page
  - `POST /api/pages/:id/blocks` - Add block to page
  - `PUT /api/pages/:id/blocks/:blockId` - Update block config
  - `DELETE /api/pages/:id/blocks/:blockId` - Delete block
  - `POST /api/pages/:id/publish` - Publish page
  - `GET /api/block-types` - Get available block types
  - `GET /api/templates` - Get pre-built templates

### 2. **Frontend Components**

#### Page Builder (`src/pages/dashboard/PageBuilder.tsx`)
- Drag-and-drop canvas with `react-beautiful-dnd`
- Component palette (10 block types)
- Real-time settings panel
- Publish/Save functionality
- Drag to reorder blocks

#### Block Settings (`src/components/PageBuilderSettings.tsx`)
- Dynamic form generation based on block type
- Settings for:
  - Hero: headline, subheadline, CTA, colors
  - Text: content, alignment
  - Pricing: title, show descriptions
  - Vehicles: title, columns, filters
  - Booking: title, availability toggle
  - Contact: title, email, submit text
  - Image: URL, alt text, height
  - CTA: heading, description, button
  - Testimonial/Footer: coming soon

#### Block Components (`src/components/BlockComponents.tsx`)
- 10 renderable block types with edit + display modes:
  1. **HeroBlock** - Image + headline + CTA
  2. **TextBlock** - Rich text editor
  3. **PricingBlock** - Dynamic pricing table
  4. **VehiclesBlock** - Vehicle showcase grid
  5. **BookingBlock** - Booking calendar widget
  6. **TestimonialBlock** - Reviews carousel
  7. **ContactBlock** - Contact form
  8. **ImageBlock** - Photo gallery
  9. **CTABlock** - Call-to-action banner
  10. **FooterBlock** - Auto-generated footer

#### Public Site Renderer (`src/pages/PublicSite.tsx`)
- `PublicSiteRenderer` - Renders published pages
- `DynamicPublicSite` - Routes custom domains to lessor pages
- SEO metadata support
- Navigation bar with branding
- Responsive design

#### Pages Dashboard (`src/pages/dashboard/PagesDashboard.tsx`)
- List all pages for lessor
- Create new pages
- Preview/Edit buttons
- Delete pages
- Custom domain management section

### 3. **Database Schema** (Already created in 004_page_builder_schema.sql)
- `fri_pages` - Page metadata (slug, title, meta_description, is_published)
- `fri_page_blocks` - Block instances (block_type, position, config JSON)
- `fri_page_templates` - Pre-built layouts
- `fri_custom_domains` - Domain management with verification
- `fri_block_types` - Reference table with 10 block types
- Indexes on lessor_id, published status, domains
- Cascade delete on blocks when page deleted
- Audit trigger for change tracking

## Next Steps

### Step 1: Deploy Database Migration
```bash
# Run in Azure Query Editor
# Copy entire 004_page_builder_schema.sql and execute
```

### Step 2: Deploy Supabase Function
```bash
# From project root:
supabase functions deploy page-builder-api

# Or with Deno directly:
deno run --allow-net supabase/functions/page-builder-api/index.ts
```

### Step 3: Wire Components into App Routes
Add to `src/App.tsx`:
```typescript
import { PageBuilder } from '@/pages/dashboard/PageBuilder';
import { PagesDashboard } from '@/pages/dashboard/PagesDashboard';
import { PublicSiteRenderer } from '@/pages/PublicSite';

// In router:
{
  path: '/dashboard/pages',
  element: <PagesDashboard />,
},
{
  path: '/dashboard/pages/:id/edit',
  element: <PageBuilder />,
},
{
  path: '/public/:slug',
  element: <PublicSiteRenderer />,
},
```

### Step 4: Install Dependencies
```bash
npm install react-beautiful-dnd
npm install -D @types/react-beautiful-dnd
```

### Step 5: Test Flow
1. Create new page in Pages Dashboard
2. Open Page Builder
3. Drag-and-drop blocks from palette
4. Configure each block in settings panel
5. Publish page
6. Preview on public site

## Architecture Decisions

### Multi-tenant Isolation
- All queries filtered by `lessor_id` from JWT token
- Prevents data leakage between lessors
- Validation on every API call

### Block-based Structure
- Flexible: 10 pre-defined block types
- Extensible: Easy to add new block types
- Config as JSON: Allows unlimited variations per block

### Two Rendering Modes
- **Edit Mode**: Shows in Page Builder canvas
- **Render Mode**: Shows on published site with `renderBlock()` dispatcher

### Custom Domains
- `fri_custom_domains` table tracks domain → lessor mapping
- `DynamicPublicSite` component handles routing
- DNS verification before SSL provisioning
- Auto-renewal of SSL certs

## Key Features

✅ Drag-and-drop page builder
✅ 10 pre-built block types
✅ Real-time settings panel
✅ One-click publish
✅ Custom domain support
✅ SEO metadata
✅ Responsive design
✅ Multi-tenant security
✅ Audit logging
✅ Block templates

## API Response Examples

### Create Page
```json
{
  "id": "uuid",
  "lessor_id": "lessor-uuid",
  "slug": "home",
  "title": "Home",
  "meta_description": "Welcome to our rental",
  "is_published": false,
  "layout_json": "{\"blocks\": []}",
  "created_at": "2024-02-15T10:00:00Z"
}
```

### Add Block
```json
{
  "id": "uuid",
  "page_id": "page-uuid",
  "block_type": "hero",
  "position": 0,
  "config": {
    "headline": "Welcome",
    "subheadline": "Book your car today",
    "cta_text": "Get Started",
    "cta_link": "#booking",
    "bg_color": "#ffffff"
  }
}
```

## Troubleshooting

### API 403 Unauthorized
- Check JWT token in Authorization header
- Verify lessor_id matches authenticated user

### Blocks not saving
- Check network tab for API errors
- Verify page published status
- Check block config is valid JSON

### Custom domain not working
- Verify CNAME DNS record
- Wait 24-48 hours for SSL cert provisioning
- Check domain verification token in settings

## Security Considerations

✅ JWT validation on all API endpoints
✅ Lessor_id validation prevents cross-tenant access
✅ XSS prevention: Config sanitized before rendering
✅ CSRF protection: POST endpoints require Authorization header
✅ Rate limiting: Can be added per endpoint
✅ Input validation: Block configs validated against schema
