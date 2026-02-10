# 🔧 PRODUCTION ENVIRONMENT SETUP GUIDE

**Purpose:** Configure all environment variables for production deployment  
**Time:** 10-15 minutes  
**Difficulty:** Easy  

---

## 📋 ENVIRONMENT FILES NEEDED

### 1. Frontend Environment (`.env.production`)
Create file at root: `/workspaces/lejio-fri/.env.production`

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Error Tracking
VITE_SENTRY_DSN=https://key@sentry.io/projectid

# Optional: Analytics
VITE_ANALYTICS_ID=G-XXXXXXXXXX

# App Configuration
VITE_APP_NAME=LEJIO FRI
VITE_APP_ENV=production
```

### 2. Backend Environment (`.env`)
Create file at root: `/workspaces/lejio-fri/.env`

```bash
# Supabase - Admin Access (for backend APIs)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Email Configuration (Nodemailer via SMTP)
SMTP_HOST=smtp.gmail.com          # or your SMTP host
SMTP_PORT=587                      # Usually 587 for TLS
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app_password        # NOT your regular password
SMTP_FROM_EMAIL=noreply@lejio.com
SMTP_FROM_NAME=LEJIO FRI

# Session Configuration
SESSION_SECRET=your-random-secret-key-min-32-chars
NODE_ENV=production

# Database (if using direct DB connections)
DB_HOST=dpg-xxxxx.postgres.render.com
DB_PORT=5432
DB_NAME=lejio_fri_db
DB_USER=lejio_fri_db_user
DB_PASSWORD=your_secure_password

# Azure Configuration (if deploying to Azure)
AZURE_STORAGE_ACCOUNT_NAME=youraccountname
AZURE_STORAGE_ACCOUNT_KEY=xxxxxxxxxxxxx

# Logging (Optional)
SENTRY_DSN=https://key@sentry.io/projectid
LOG_LEVEL=info
```

---

## 🔍 HOW TO GET THESE VALUES

### Supabase Keys
1. Go to **Supabase Dashboard** → Your Project
2. Click **Settings** → **API**
3. Copy:
   - `Project URL` → `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_KEY`

### Stripe Keys
1. Go to **Stripe Dashboard** → **Developers** → **API Keys**
2. Copy:
   - **Secret Key** (sk_live_...) → `STRIPE_SECRET_KEY`
   - **Publishable Key** (pk_live_...) → `STRIPE_PUBLISHABLE_KEY`
3. For webhooks:
   - Go to **Webhooks** → Create webhook for production URL
   - Copy **Signing Secret** → `STRIPE_WEBHOOK_SECRET`

### Email (Gmail Example)
1. Go to **Google Account** → **Security**
2. Enable **2-Step Verification**
3. Generate **App Password** (not your regular password)
4. Use app password in `SMTP_PASSWORD`
5. Set:
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_USER=your-email@gmail.com`

### Email (SendGrid Alternative)
```bash
# If using SendGrid instead:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxx
```

### Email (AWS SES)
```bash
# If using AWS SES:
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=ses_username
SMTP_PASSWORD=ses_password
```

---

## ✅ VERIFICATION CHECKLIST

After setting environment variables:

### 1. Database Connection
```bash
# Test Supabase connection
echo "SELECT version();" | \
  psql "postgresql://postgres:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Should return PostgreSQL version
```

### 2. Stripe Connection
```bash
# Test Stripe API key
curl https://api.stripe.com/v1/customers \
  -u $STRIPE_SECRET_KEY:

# Should return customer list (possibly empty)
```

### 3. Email Configuration
```bash
# Test email (via Azure Function)
# Call SendTestEmail endpoint with SMTP config
# Should receive test email at configured address
```

### 4. Build with Production Env
```bash
# Build with production config
npm run build

# Should complete in ~14-15 seconds with 0 errors
```

---

## 🔐 SECURITY NOTES

### Never Commit Secrets
```bash
# .env is in .gitignore - good!
# But double-check:
cat .gitignore | grep ".env"
# Should show: .env, .env.local, etc.
```

### Environment-Specific Files
```bash
# Recommended structure:
.env.development    # Local development
.env.staging        # Staging/QA
.env.production     # Production
.env.local          # Your personal overrides (not committed)
```

### Rotate Secrets Regularly
- [ ] Stripe: Rotate API keys every 3-6 months
- [ ] Email: Rotate passwords every 2-3 months
- [ ] Database: Rotate credentials after deployment
- [ ] Session: Change SESSION_SECRET on major updates

---

## 📦 AZURE STATIC WEB APPS (Recommended)

If deploying to Azure Static Web Apps, use their **Configuration** → **Application settings**:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app_password
```

---

## 📦 RENDER (Also Good Option)

If deploying to Render, set in **Environment** tab:

- Web Service: Frontend + backend env vars
- Background Worker (optional): For job processing
- PostgreSQL: Use managed database or connect to Supabase

---

## 📦 VERCEL (Frontend Only)

If deploying frontend to Vercel only:

Go to **Settings** → **Environment Variables**:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SENTRY_DSN (optional)
```

Deploy backend separately (Azure Functions, Render, etc.)

---

## 🧪 TEST AFTER DEPLOYMENT

Once deployed, test these critical paths:

### 1. Plan Change
```bash
# POST /api/ChangePlan
# Body: { plan: "elite", paymentMethod: "card", ... }
# Expected: 200 OK, plan updated, email sent
```

### 2. Logo Upload
```bash
# POST /api/UploadCompanyLogo
# Body: { logo: "base64_string" }
# Expected: Logo in Supabase Storage, public URL returned
```

### 3. Email Sending
```bash
# POST /api/SendTestEmail
# Expected: Test email arrives in inbox
```

### 4. Module Management
```bash
# GET /api/GetModules
# POST /api/SetModule
# Expected: Module list and activation/deactivation working
```

---

## ❌ COMMON DEPLOYMENT ISSUES

### Issue: "Supabase URL not configured"
**Fix:** Ensure `VITE_SUPABASE_URL` is set in frontend env

### Issue: "Cannot reach SMTP server"
**Fix:** 
- Verify SMTP_HOST is correct
- Check SMTP_PORT (usually 587 for TLS, 465 for SSL)
- Verify SMTP_USER and SMTP_PASSWORD
- Check firewall allows outgoing port 587/465

### Issue: "Stripe key invalid"
**Fix:**
- Verify using `sk_live_` (not `sk_test_`)
- Check key hasn't expired
- Verify correct Stripe account

### Issue: Build fails with "Cannot find module"
**Fix:**
- Run `npm install` again
- Clear `node_modules` and rebuild
- Check Node.js version matches `.nvmrc`

---

## ✨ DEPLOYMENT SUCCESS CHECKLIST

- [ ] All environment files created
- [ ] All secrets filled in correctly
- [ ] .env added to .gitignore
- [ ] Build succeeds: `npm run build` = 0 errors
- [ ] Critical paths tested (plan, logo, email)
- [ ] Monitoring configured (Sentry, etc.)
- [ ] Backups configured
- [ ] HTTPS enforced
- [ ] Error pages configured
- [ ] Subdomain/custom domain configured

---

**Once this is complete, you're ready to go live! 🚀**

*Created: January 27, 2026*  
*For: LEJIO FRI Production Deployment*
