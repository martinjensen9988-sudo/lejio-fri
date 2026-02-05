# Azure Static Web Apps Deployment Guide - Lejio Fri

## Overview
This guide explains how to deploy Lejio Fri (white-label SaaS) to **Azure Static Web Apps** with support for multi-tenant domains.

## Prerequisites

1. **Azure Subscription**
   - Free tier available for Static Web Apps
   - Create one at: https://portal.azure.com

2. **GitHub Account**
   - Repository must be on GitHub (already done ✓)
   - Actions enabled (default)

3. **Azure Resources**
   - Static Web App instance
   - Azure PostgreSQL server (for data)
   - Supabase project (for auth)

## Step 1: Create Azure Static Web App

### Via Azure Portal:

1. Go to **Azure Portal** → **Static Web Apps**
2. Click **Create**
3. Configure:
   ```
   Resource Group: lejio-fri
   Name: lejio-fri-app
   Plan type: Free
   Region: Choose closest to users (EU West)
   ```

4. Click **Sign in with GitHub**
   - Authorize Azure to access your repos
   - Select repository: `martinjensen9988-sudo/lejio-b75cff1f`
   - Branch: `main`

5. Build Configuration:
   ```
   Build Presets: React
   App location: / (root)
   API location: (leave empty - we use Supabase)
   Output location: dist
   ```

6. Click **Create**

Azure will:
- Create the Static Web App
- Generate a deployment token
- Add it to GitHub Secrets automatically
- Trigger first deployment

## Step 2: Configure GitHub Secrets

After Azure creates the app, it sets `AZURE_STATIC_WEB_APPS_API_TOKEN` automatically.

If manual setup needed:
1. Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:

```
AZURE_STATIC_WEB_APPS_API_TOKEN: <from Azure portal>
VITE_SUPABASE_URL: <your Supabase URL>
VITE_SUPABASE_ANON_KEY: <your Supabase anon key>
```

## Step 3: Environment Variables

### For Vite Build:

Create or update `.env.production`:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Azure Static Web Apps adds these automatically
AZURE_ENVIRONMENT=production
```

### For Each Lessor (Domain Routing):

Azure Static Web Apps doesn't support per-domain env vars out of the box.

**Solution**: Use custom domain routing + runtime detection

1. **Point lessor domains to Azure** (via DNS)
   ```
   CNAME: lessor.example.com → lejio-fri-app.azurestaticapps.net
   ```

2. **Detect domain at runtime** (in `src/App.tsx`):
   ```typescript
   const hostname = window.location.hostname;
   // Route to appropriate lessor dashboard
   ```

3. **Data isolation via Supabase RLS** (already implemented ✓)
   - Each lessor authenticates with their account
   - RLS policies ensure they only see their data

## Step 4: Custom Domains for Lessors

### For each lessor's white-label domain:

1. **Azure Portal** → **Your Static Web App** → **Custom domains**
2. Click **Add**
3. Enter lessor domain: `lessor-name.lejio.app`
4. Add DNS CNAME record:
   ```
   Host: lessor-name
   Type: CNAME
   Value: lejio-fri-app.azurestaticapps.net
   ```
5. Azure validates and enables HTTPS automatically (Let's Encrypt)

### Example Setup:
```
lessor1.lejio.app → lejio-fri-app.azurestaticapps.net (hosted by Azure)
lessor2.lejio.app → lejio-fri-app.azurestaticapps.net (same app, different lessor)
lessor3.lejio.app → lejio-fri-app.azurestaticapps.net (data isolated by RLS)
```

## Step 5: Verify Deployment

### Check deployment status:

1. **GitHub Actions**:
   - Go to repo → **Actions**
   - Watch workflow: `azure-static-web-apps-deploy.yml`
   - Should complete in ~5 minutes

2. **Azure Portal**:
   - Static Web App → **Overview**
   - Copy default URL: `https://lejio-fri-app.azurestaticapps.net`
   - Test at that URL

3. **Test the app**:
   ```
   https://lejio-fri-app.azurestaticapps.net/fri
   → Login/Signup should work
   → Dashboard should load
   ```

## Step 6: Configure Supabase (One-Time)

### Authentication:
- Add Azure Static Web App URL to Supabase allowed URLs:
  1. Supabase Dashboard → Project → **Settings** → **Auth**
  2. **Redirect URLs**: Add
     ```
     https://lejio-fri-app.azurestaticapps.net/fri/login
     https://lejio-fri-app.azurestaticapps.net/fri/dashboard
     https://[lessor-domain]/fri/login
     https://[lessor-domain]/fri/dashboard
     ```

### Database (Azure PostgreSQL):
- Update connection in hooks if needed
- Current setup uses Supabase for all data
- When Azure PostgreSQL is added, update connection string in environment

## Step 7: Set Up Azure PostgreSQL (Optional - For Data)

Currently using Supabase for data. To use Azure PostgreSQL instead:

1. **Create PostgreSQL server**:
   ```
   Azure Portal → Azure Database for PostgreSQL
   Server name: lejio-fri-db
   Region: Same as Static Web App
   Admin: lejio-admin
   Password: [strong password]
   ```

2. **Update connection string**:
   ```
   DATABASE_URL=postgresql://lejio-admin:password@lejio-fri-db.postgres.database.azure.com/lejio_fri_db?sslmode=require
   ```

3. **Add to Static Web App environment**:
   - Azure Portal → Static Web App → **Configuration**
   - Add `DATABASE_URL` as app setting

## Continuous Deployment

### Automatic Updates:

Every time you push to `main`:
1. GitHub Actions triggers
2. Builds the app (`npm run build`)
3. Uploads `/dist` to Azure
4. Deployment live in ~5 minutes

### Rollback:

If deployment fails:
1. **GitHub Actions** → Click failed run
2. **Re-run** button to retry
3. Or revert commit and push new fix

## Performance & Monitoring

### Azure Static Web Apps Features:

✅ **Global CDN** - Files cached worldwide
✅ **Automatic HTTPS** - All domains get SSL cert
✅ **Staging environments** - Pull requests get preview URLs
✅ **Custom domains** - Unlimited white-label domains
✅ **Free tier** - Up to 100GB bandwidth/month

### Monitor:

1. **Performance**:
   - Azure Portal → Static Web App → **Analytics**
   - View requests, errors, performance

2. **Logs**:
   - Check GitHub Actions logs for build issues
   - Browser console for frontend errors

## Troubleshooting

### Build Fails:
```bash
# Run locally first
npm run build
# Check for errors, then push
```

### 404 on Routes:
✓ Already configured in `staticwebapp.config.json`
- All routes redirect to `index.html` (SPA routing works)

### Custom Domain Not Working:
1. Verify DNS CNAME is correct
2. Wait 24-48 hours for DNS propagation
3. Check Azure Portal → Custom domains status

### Supabase Auth Not Working:
1. Verify redirect URLs in Supabase settings
2. Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. Browser DevTools → Network → Check for 401/403

## Cost Estimation (Free Tier)

- **Static Web Apps**: Free (100GB bandwidth/month)
- **Supabase**: Free tier (500MB storage, 2 million requests/month)
- **Azure PostgreSQL**: Paid (~$15-50/month depending on tier)

**For 1 lessor**: ~$0-20/month
**For 10 lessors**: ~$0-20/month (shared infrastructure)
**For 100 lessors**: ~$20-100/month (scale PostgreSQL)

## Next Steps

1. ✅ Create Azure Static Web App
2. ✅ Configure GitHub Actions (automated)
3. ✅ Add custom domains for lessors
4. ✅ Test deployment with lessors
5. Monitor and scale as needed

---

**Questions?** Check:
- Azure Docs: https://learn.microsoft.com/azure/static-web-apps/
- Supabase Docs: https://supabase.com/docs
- GitHub Actions: https://docs.github.com/actions
