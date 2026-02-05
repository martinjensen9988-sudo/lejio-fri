# 🌐 Step 1: Database Setup - Instructions for You

## ⚠️ Important: These commands must be run on YOUR machine (not in this dev container)

Since Supabase CLI requires authentication with your personal Supabase account, you'll need to run these commands locally.

---

## Option A: Using Supabase CLI (Recommended)

### Prerequisites
- Node.js installed on your machine
- Supabase account (https://supabase.com)

### Step-by-Step

#### 1. Install Supabase CLI
```bash
npm install -g @supabase/cli
# or
brew install supabase/tap/supabase  # macOS
```

#### 2. Login to Supabase
```bash
supabase login
# Opens browser to authenticate
# Copy the access token when prompted
```

#### 3. Navigate to project
```bash
cd /path/to/lejio-b75cff1f
```

#### 4. Push migrations to your Supabase project
```bash
supabase db push
```

**Expected output:**
```
✓ Migrations pushed successfully
  - Created table: corporate_roles
  - Created table: email_templates
  - Created table: email_logs
  - Created table: corporate_documents
  - Created table: api_keys
  - Created table: api_logs
```

#### 5. Regenerate TypeScript types
```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

**Find YOUR_PROJECT_ID:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to Settings → General
4. Copy "Project ID"

#### 6. Verify no TypeScript errors
```bash
npm run build
```

Should show: ✅ Build passing

---

## Option B: Manual SQL Push (If CLI doesn't work)

### Alternative: Use Supabase Dashboard

#### 1. Get migration SQL
File location: `supabase/migrations/20260127_create_corporate_roles.sql`

#### 2. Go to Supabase Dashboard
1. Navigate to https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor (left sidebar)
4. Click "New Query"

#### 3. Copy & Paste SQL
- Open `supabase/migrations/20260127_create_corporate_roles.sql`
- Copy ALL content
- Paste into Supabase SQL Editor
- Click "Run"

#### 4. Verify tables created
Go to Database → Tables in left sidebar
Should see:
- ✅ corporate_roles
- ✅ email_templates
- ✅ email_logs
- ✅ corporate_documents
- ✅ api_keys
- ✅ api_logs

#### 5. Regenerate types manually
In Supabase Dashboard:
1. Go to Settings → API
2. Under "TypeScript" section
3. Copy the generated types
4. Save to `src/integrations/supabase/types.ts`

---

## What These Migrations Do

### Tables Created:

1. **corporate_roles**
   - Store role definitions
   - Stores permissions as JSONB array
   - Linked to corporate_accounts

2. **email_templates**
   - Email template storage
   - Subject, body, recipient groups
   - Support for variable placeholders

3. **email_logs**
   - Track all sent emails
   - Status: pending/sent/failed
   - Response time tracking

4. **corporate_documents**
   - Document metadata
   - File path in Supabase Storage
   - Visibility controls (private/internal/public)

5. **api_keys**
   - API key storage
   - Scopes and expiration
   - Rate limiting ready

6. **api_logs**
   - API request logging
   - Method, endpoint, status, response time
   - Audit trail

---

## After Migrations Complete

### ✅ Checklist
- [ ] Ran `supabase db push` successfully
- [ ] Ran `supabase gen types typescript`
- [ ] Build passes: `npm run build`
- [ ] No TypeScript errors in components
- [ ] All 6 tables visible in Supabase Dashboard

### 🎯 Next Steps
Once verified:
1. Commit type changes: `git add src/integrations/supabase/types.ts && git commit -m "Update: Regenerated Supabase types after migrations"`
2. Push to GitHub: `git push origin main`
3. Proceed to Step 2: Testing

---

## Troubleshooting

### "Permission denied" error
→ Run `supabase login` again

### "Project not found"
→ Check project ID is correct: `supabase projects list`

### "Migration already applied"
→ Safe to ignore - means it's already there

### Build still has TypeScript errors
→ Make sure types file was regenerated correctly
→ Check src/integrations/supabase/types.ts was updated

---

## Migration File Details

**File:** `supabase/migrations/20260127_create_corporate_roles.sql`
**Size:** 224 lines
**Contains:**
- 6 table definitions
- RLS policies for each table
- Performance indexes
- Timestamp tracking
- Audit columns

**Status:** Ready to deploy ✅

---

Last updated: January 27, 2026
Ready for your Supabase deployment!
