# Lejio Fri - Architecture & Development Plan

## 1. HVAD ER LEJIO FRI?

**Lejio Fri** er en hvid-label billeudleningsplatform hvor:
- **Lessors** (billejeudlejere) kan oprette deres egen billeudlejingswebsite
- **Admin** styrer Lejio Fri platformen selv
- **Customers** kan leje biler fra lessors

**Nøglefunktioner:**
- PageBuilder: Lessors laver deres egen hjemmeside via drag-drop editor
- Dashboard: Lessors administrerer deres biler, bookinger, invoicer
- Booking System: Customers booker biler online
- Multi-tenant: Hver lessor har sin egen subdomain/domain

## 2. TEKNOLOGI STACK

**Frontend:**
- Vite + React + TypeScript
- Tailwind CSS + shadcn-ui
- React Router for navigation
- @tanstack/react-query for data fetching

**Backend:**
- Azure Static Web Apps (hosting)
- Azure Functions (API endpoints) i `/api` folder
- Node.js runtime
- Mock authentication (test users)

**Database:**
- Azure SQL (lagring af user data, pages, bookings osv.)
- SQL migrations i `supabase/migrations/` (deploy til Azure SQL)

**Deployment:**
- GitHub Actions CI/CD automatisk deploy på push til main
- Azure Static Web Apps managed API feature

## 3. ARKITEKTUR OVERBLIK

```
┌─────────────────────────────────────┐
│     Frontend (React + Vite)         │
│  ├─ FRI Landing (public)            │
│  ├─ FRI Login/Signup                │
│  ├─ FRI Dashboard (lessor)          │
│  ├─ PageBuilder (drag-drop editor)  │
│  └─ Public Site Renderer            │
└────────────┬────────────────────────┘
             │ HTTPS
             ↓
┌─────────────────────────────────────┐
│   Azure Static Web Apps             │
│  (Hosted frontend + managed API)    │
└────────────┬────────────────────────┘
             │ /api/* requests
             ↓
┌─────────────────────────────────────┐
│    Azure Functions (Backend API)    │
│  ├─ AuthLogin, AuthMe, AuthLogout   │
│  ├─ GetPages, CreatePage, UpdatePage│
│  ├─ AddPageBlock, UpdatePageBlock    │
│  └─ Other endpoints                 │
└────────────┬────────────────────────┘
             │ Database queries
             ↓
┌─────────────────────────────────────┐
│   Azure SQL (Azure SQL Database Database)    │
│  ├─ auth (users)                    │
│  ├─ lessor_pages                    │
│  ├─ page_blocks                     │
│  ├─ bookings                        │
│  ├─ vehicles                        │
│  └─ other tables                    │
└─────────────────────────────────────┘
```

## 4. KEY FEATURES & COMPONENTS

### 4.1 Authentication (✅ DONE)
- **Mock test user:** martin@lejio.dk / password: test
- **Real endpoint:** `/api/AuthLogin` (POST)
  - Returns: `{ session: { access_token, user } }`
  - Token stored i localStorage som `fri-auth-token`
- **Session check:** `/api/AuthMe` (GET) with Authorization header
- **Context provider:** `FriAuthProvider` + `useFriAuthContext()`

### 4.2 FRI Dashboard (✅ PARTIALLY DONE)
- **Route:** `/fri/dashboard`
- **Protected:** Requires login via `FriAuthProvider`
- **Features:**
  - Overview tab with stats (vehicles, bookings, revenue)
  - Vehicles tab (placeholder for now)
  - Bookings tab (placeholder)
  - Invoices tab (placeholder)
  - Analytics tab (placeholder)
  - Team tab (placeholder)
  - Settings tab (placeholder)
  - **NEW:** "📄 Lav Hjemmeside" button → `/dashboard/pages`

### 4.3 PageBuilder (🟡 IN PROGRESS)
**What it does:**
- Lessors create custom HTML pages using drag-drop interface
- Pages stored in database
- Each page has multiple "blocks" (Hero, Features, CTA, Pricing osv.)
- Pages can be published and shared publicly

**Architecture:**
- **Frontend:** `src/pages/dashboard/PageBuilder.tsx` (drag-drop editor)
- **Frontend:** `src/pages/dashboard/PagesDashboard.tsx` (list pages)
- **Frontend:** `src/pages/PublicSite.tsx` (public renderer)
- **Backend:** 7 API endpoints:
  - `GET /api/GetPages` - fetch pages for lessor
  - `POST /api/CreatePage` - create new page
  - `PUT /api/UpdatePage` - update page metadata
  - `DELETE /api/DeletePage` - delete page
  - `POST /api/AddPageBlock` - add block to page
  - `PUT /api/UpdatePageBlock` - update block config
  - `DELETE /api/DeletePageBlock` - remove block
- **Storage:** Currently in-memory mock, needs Azure SQL integration
- **Block types:** Hero, Text, Pricing, Vehicles, Booking, Contact, Image, CTA, Testimonial, Footer

### 4.4 Database Schema (🟡 MIGRATION READY)
```sql
-- Lessors/Users
users (id, email, password_hash, user_type, created_at)

-- Pages
lessor_pages (id, lessor_id, slug, title, meta_description, is_published, created_at, updated_at)

-- Page content
page_blocks (id, page_id, block_type, position, config[JSON], created_at, updated_at)

-- Vehicles
vehicles (id, lessor_id, make, model, year, license_plate, daily_rate, status, created_at)

-- Bookings
bookings (id, lessor_id, vehicle_id, customer_email, start_date, end_date, total_price, status, created_at)

-- Invoices
invoices (id, lessor_id, booking_id, amount, status, due_date, created_at)
```

## 5. CURRENT STATUS

### ✅ DONE:
- GitHub Actions workflow (automatic Azure deployment)
- Azure Static Web Apps hosting
- 7 Azure Function endpoints
- Mock authentication system
- FRI dashboard loads without errors
- PageBuilder API endpoints created
- PageBuilder knap tilføjet til dashboard
- Database migrations created
- Timeout issues identified and mitigated

### 🟡 IN PROGRESS:
- PageBuilder persistent storage (API ready, needs DB connection)
- Dashboard sub-tabs data loading
- Real authentication against database

### ❌ TODO:
- Connect API endpoints to Azure SQL database
- Implement real token validation
- Load pages from database in PageBuilder UI
- Booking system implementation
- Invoice generation
- Payment integration (Stripe)
- Admin panel functionality
- Live chat integration
- Search/filtering
- Multi-domain support (subdomains per lessor)

## 6. HOW TO BUILD FEATURES

### Adding a new API endpoint:
1. Create folder: `/api/EndpointName/`
2. Create `function.json` with HTTP binding
3. Create `index.js` with handler logic
4. Update frontend to call it (via `/api/EndpointName`)
5. Deploy automatically via GitHub Actions

### Adding a frontend page:
1. Create component: `src/pages/path/ComponentName.tsx`
2. Add route in `src/App.tsx`
3. Lazy-load if needed
4. Call API endpoints for data

### Connecting to database:
1. Create Azure SQL table (migration file)
2. Create API endpoint that queries table
3. Update frontend hook to use API endpoint


## 7. IMPORTANT NOTES

### Authentication:
- ⚠️ Test token validation is mock (just checks presence)
- Real validation needed: decode JWT, check lessor_id, etc.
- Token format: Base64 JSON with lessor_id, email, iat

### Storage:
- ⚠️ ONLY USE AZURE SQL - use Azure SQL or file-based
- Current PageBuilder API uses in-memory mock storage
- Need persistent storage layer (Azure SQL or files on disk)


### Deployment:
- GitHub Actions workflow: `.github/workflows/azure-static-web-apps-deploy.yml`
- Auto-deploys on push to main
- Takes ~2 minutes for deployment

## 8. NEXT STEPS (PRIORITY ORDER)

1. **Connect PageBuilder to Azure SQL**
   - Update API endpoints to read/write lessor_pages table
   - Test CRUD operations
   - Verify pages persist

2. **Load pages in PageBuilder UI**
   - Update `usePages` hook to use real API
   - Fetch pages on component mount
   - Display in list view

3. **Implement booking system**
   - Create booking API endpoints
   - Build booking form/calendar
   - Save bookings to database

4. **Improve authentication**
   - Real token validation
   - Email verification
   - Password reset flow

5. **Admin panel**
   - Lessor management
   - Payment tracking
   - Support tickets

## 9. TESTING

**Test flow:**
1. Go to `https://zealous-stone-04c86dd03.2.azurestaticapps.net/fri/login`
2. Login: martin@lejio.dk / test
3. See FRI Dashboard
4. Click "📄 Lav Hjemmeside" button
5. Should go to PageBuilder dashboard
6. Try creating a page via UI

**API testing:**
```bash
# Create page
curl -X POST https://zealous-stone-04c86dd03.2.azurestaticapps.net/api/CreatePage \
  -H "Content-Type: application/json" \
  -d '{"lessor_id":"test-1","title":"Home","slug":"home"}'

# Get pages
curl "https://zealous-stone-04c86dd03.2.azurestaticapps.net/api/GetPages?lessor_id=test-1"
```

## 10. FILE STRUCTURE KEY

```
/workspaces/lejio-b75cff1f/
├── src/
│   ├── pages/
│   │   ├── fri/
│   │   │   ├── dashboard/Dashboard.tsx ← FRI Dashboard
│   │   │   ├── auth/LoginPage.tsx ← Login
│   │   │   └── landing/LandingPage.tsx
│   │   └── dashboard/
│   │       ├── PageBuilder.tsx ← Editor
│   │       ├── PagesDashboard.tsx ← List
│   │       └── PublicSite.tsx ← Public renderer
│   ├── components/
│   │   ├── BlockComponents.tsx ← Block types (Hero, CTA osv.)
│   │   └── PageBuilderSettings.tsx ← Block settings
│   ├── hooks/
│   │   ├── useAuth.tsx ← Auth hook
│   │   ├── useFriAuth.tsx ← FRI auth hook
│   │   └── usePages.tsx ← Pages hook (connects to API)
│   ├── providers/
│   │   ├── FriAuthProvider.tsx ← Auth context
│   │   └── BrandContext.tsx ← Branding context
│   └── integrations/
│       └── azure/client.ts ← API client
├── api/
│   ├── AuthLogin/ ← Login endpoint
│   ├── AuthMe/ ← Session check endpoint
│   ├── GetPages/ ← Fetch pages
│   ├── CreatePage/ ← Create page
│   ├── UpdatePage/ ← Update page
│   ├── DeletePage/ ← Delete page
│   ├── AddPageBlock/ ← Add block
│   ├── UpdatePageBlock/ ← Update block
│   ├── DeletePageBlock/ ← Delete block
│   └── storage.js ← File-based storage helper
├── supabase/
│   ├── migrations/
│   │   └── 20260203_create_lessor_pages.sql ← DB schema
│   └── config.toml
├── .github/workflows/
│   └── azure-static-web-apps-deploy.yml ← CI/CD
├── .vscode/
│   └── settings.json ← VS Code config
```

---

**Last Updated:** 2026-02-03
**Status:** Deployment ready, PageBuilder API endpoints working, persistent storage needed
**Next AI:** Read this file for full context before continuing development

## 11. DEVELOPMENT SETUP & COMMANDS

**Installation:**
```bash
cd /workspaces/lejio-b75cff1f
npm install
npm run dev
```

**Available Commands:**
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

**Development Server:**
- Local: http://localhost:5173 (Vite dev server)
- Frontend is auto-reloading on file changes

## 12. CRITICAL CONSTRAINTS & RULES

⚠️ **MUST FOLLOW THESE:**

1. **Database Technology:**
   - ✅ USE ONLY: Azure SQL Database
   - ❌ DO NOT USE: Supabase (explicitly forbidden)
   - ❌ DO NOT USE: Firebase, MongoDB, PostgreSQL (unless via Azure)

2. **Styling:**
   - USE: Tailwind CSS utility classes
   - USE: shadcn-ui components from `src/components/ui/`
   - DO NOT: Write custom CSS unless absolutely necessary

3. **Authentication:**
   - Mock test user: `martin@lejio.dk` / `test`
   - Token stored: localStorage as `fri-auth-token`
   - Bearer token in Authorization header for API calls
   - Token format: Base64 JSON with `lessor_id`, `email`, `iat`

4. **API Endpoints:**
   - All backend code in `/api/` folder
   - Each endpoint has: `function.json` (config) + `index.js` (handler)
   - Frontend calls via `/api/EndpointName` (no /api/EndpointName/)
   - All endpoints return JSON

5. **Imports:**
   - Use `@/` alias for `src/` (configured in vite.config.ts)
   - Example: `import { useAuth } from '@/hooks/useAuth'`


7. **Component Structure:**
   - Pages: `src/pages/path/ComponentName.tsx` (PascalCase)
   - Hooks: `src/hooks/useHookName.ts` (camelCase)
   - Components: `src/components/ComponentName.tsx` (PascalCase)
   - Lazy load pages in App.tsx for performance

## 13. PRODUCTION DEPLOYMENT

**Hosting:** Azure Static Web Apps
- **Domain:** https://zealous-stone-04c86dd03.2.azurestaticapps.net
- **Auto-deploy:** On every push to main branch via GitHub Actions
- **Deployment time:** ~2 minutes
- **Workflow file:** `.github/workflows/azure-static-web-apps-deploy.yml`

**How to Deploy:**
1. Make changes in local git
2. Commit to main branch: `git commit -m "message"`
3. Push to GitHub: `git push origin main`
4. GitHub Actions automatically builds and deploys
5. Check status in GitHub Actions tab

**Pre-deployment:**
- Run `npm run lint` to check for errors
- Verify API endpoints are working
- Test in local dev server first

## 14. AUTHENTICATION FLOW

```
┌─────────────────────────────────────┐
│    User visits /fri/login           │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  LoginPage.tsx component            │
│  (form for email/password)          │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  POST /api/AuthLogin                │
│  (validate credentials)             │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Returns: { access_token, user }    │
│  Token saved to localStorage        │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  FriAuthProvider wraps app          │
│  useFriAuthContext() to access user │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│  Protected routes check auth        │
│  Redirect to login if not authed    │
└─────────────────────────────────────┘
```

## 15. KNOWN ISSUES & SOLUTIONS

**Problem:** Dashboard throws "Noget gik galt" error
**Root Cause:** Sub-components need database APIs not yet implemented
**Solution:** Remove problematic components until database is ready
**Status:** ✅ Fixed in current version

### Issue 2: Missing BrandProvider
**Problem:** useBrand() hook errors if not wrapped in provider
**Root Cause:** Component used outside provider context
**Solution:** Wrap dashboard route in `<BrandProvider>`
**Status:** ✅ Fixed in current version

### Issue 3: Persistent Storage
**Problem:** Pages and blocks not persisting across sessions
**Root Cause:** Currently using in-memory storage
**Solution:** Connect API endpoints to Azure SQL database
**Status:** 🟡 In progress - migration ready, needs connection

## 16. TEAM & COLLABORATION

**Repository:**
- GitHub: https://github.com/martinjensen9988-sudo/lejio-b75cff1f
- Branch: main (default)
- CI/CD: GitHub Actions (automatic Azure deployment)

**Handoff Instructions:**
- New developers must read LEJIO_FRI_ARCHITECTURE.md first
- Use Azure SQL ONLY (never Supabase)
- Follow all constraints in section 12
- Use terminal commands, never file tools
- Test locally before pushing
- Push to main triggers automatic deployment

## 17. TESTING CHECKLIST

### Frontend Testing:
- [ ] Login page loads
- [ ] Can login with martin@lejio.dk / test
- [ ] Dashboard displays after login
- [ ] "📄 Lav Hjemmeside" button visible and clickable
- [ ] Navigates to PageBuilder on button click
- [ ] PageBuilder UI loads
- [ ] Can create new page
- [ ] Can add blocks to page
- [ ] Can drag-drop blocks (when implemented)
- [ ] Can save/publish page

### Backend Testing:
- [ ] GET /api/AuthMe returns user data
- [ ] POST /api/CreatePage accepts page data
- [ ] GET /api/GetPages returns pages for lessor
- [ ] PUT /api/UpdatePage updates page
- [ ] DELETE /api/DeletePage removes page
- [ ] POST /api/AddPageBlock adds block
- [ ] PUT /api/UpdatePageBlock updates block
- [ ] DELETE /api/DeletePageBlock removes block

### Database Testing:
- [ ] Pages persist after refresh
- [ ] Blocks persist in database
- [ ] Multiple pages can be created per lessor
- [ ] Pages are isolated by lessor_id

## 18. QUICK REFERENCE

**Test User:**
- Email: martin@lejio.dk
- Password: test

**Production URL:**
- https://zealous-stone-04c86dd03.2.azurestaticapps.net

**Key Files:**
- Frontend auth: `src/hooks/useFriAuthContext.tsx`
- PageBuilder hook: `src/hooks/usePages.tsx`
- Dashboard: `src/pages/fri/dashboard/Dashboard.tsx`
- Block components: `src/components/BlockComponents.tsx`
- API config: `src/integrations/azure/client.ts`
- Database migrations: `supabase/migrations/20260203_create_lessor_pages.sql`

**Key Endpoints:**
- POST /api/AuthLogin - Login
- GET /api/AuthMe - Check session
- GET /api/GetPages - List pages
- POST /api/CreatePage - Create page
- POST /api/AddPageBlock - Add block to page

**NPM Commands:**
- `npm run dev` - Start dev server
- `npm run build` - Build production
- `npm run lint` - Check for errors

---

**IMPORTANT:** This is a complete specification. Any future development must:
1. Read this entire document first
2. Follow all constraints (especially Azure SQL, no Supabase)
3. Use terminal commands only (no file tools)
4. Test before pushing to main
5. Auto-deployment triggers on push

**Last Updated:** 2026-02-03
**Completeness:** 100% - All planned features documented
**Next Developer:** Read sections 1-4, then 12, then dive into specific feature
