# 🚀 LEJIO FRI - Render Deployment Guide

**Status:** PostgreSQL Migration Complete ✅  
**Date:** February 5, 2026  
**Target:** Render.com with PostgreSQL

---

## 📋 Complete Setup Checklist

### Phase 1: Repository Preparation ✅
- [x] Konverteret Azure SQL schema til PostgreSQL
- [x] Opdateret API endpoints til pg library
- [x] Oprettet Express server.js
- [x] Oprettet render.yaml configuration
- [x] Oprettet database helper (db.js)
- [x] Oprettet .env.render template

### Phase 2: Render Setup (Your Action)
- [ ] **Step 1:** Opret Render account
- [ ] **Step 2:** Forbind GitHub repository
- [ ] **Step 3:** Opret PostgreSQL database
- [ ] **Step 4:** Konfigurer Web Service
- [ ] **Step 5:** Sæt miljøvariable
- [ ] **Step 6:** Deploy & test

---

## 🔧 STEP-BY-STEP DEPLOYMENT

### STEP 1: Opret Render Account
1. Gå til [render.com](https://render.com)
2. Klik "Sign up" og log ind med GitHub
3. Autoriser Render til at få adgang til din GitHub

### STEP 2: Forbind GitHub Repository
1. Fra Render Dashboard: **"New +" → "Web Service"**
2. Vælg **"Connect a repository"**
3. Vælg dit repository: `lejio-fri`
4. Vælg branch: `main`
5. Klik **"Connect"**

### STEP 3: Opret PostgreSQL Database

#### Option A: Via Render Dashboard (Anbefalet)
1. **"New +" → "PostgreSQL"**
2. **Database Name:** `lejio-fri`
3. **Region:** Copenhagen (eller din region)
4. **PostgreSQL Version:** 15
5. **Plan:** Standard ($15/month)
6. Klik **"Create Database"**

#### Option B: Konfigurer i render.yaml (Automatisk)
```yaml
databases:
  - name: lejio-fri-db
    engine: postgres
    ipAllowList: []
```

### STEP 4: Web Service Configuration

Efter at forbinde GitHub, udfyld felterne:

| Field | Value |
|-------|-------|
| **Name** | `lejio-fri` |
| **Environment** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Region** | Copenhagen |
| **Plan** | Standard (eller Free for test) |

### STEP 5: Sæt Miljøvariable

I Render Dashboard → Your Web Service → **Environment**:

```
NODE_ENV=production
DB_HOST=[Kopier fra PostgreSQL instance]
DB_PORT=5432
DB_NAME=lejio_fri
DB_USER=postgres
DB_PASSWORD=[Kopier fra PostgreSQL instance]
DB_SSL=true
PORT=3000
```

**Hvor finder jeg disse værdier?**
- Gå til **PostgreSQL service** → **Connections**
- Under "Internal Database URL" finder du:
  - Host
  - Port
  - Username
  - Password

### STEP 6: Deploy & Test

1. Gå til **"Deployments"** tab
2. Klik **"Manual Deploy"** for at starte build
3. Vent på build at færdiggøre (~5-10 min)
4. Når færdig, klik på **URL'en** for at teste

---

## ✅ Test Efter Deploy

### 1. Test Health Check
```bash
curl https://your-render-app.onrender.com/api/health
```

**Expected Response:**
```json
{"status":"OK","timestamp":"2026-02-05T10:00:00Z"}
```

### 2. Test Frontend
Go to `https://your-render-app.onrender.com` i browser

### 3. Test Database Connection
```bash
curl https://your-render-app.onrender.com/api/get-vehicles?lessor_id=test-123
```

---

## 🗄️ Database Migration

### Automatisk PostgreSQL Setup
Kør denne SQL i Render PostgreSQL:

```sql
\c lejio_fri;

-- Kopier hele indholdet af database/schema.postgres.sql
-- og kør det her
```

**Eller bruge psql command-line:**
```bash
psql postgresql://postgres:PASSWORD@HOST:5432/lejio_fri < database/schema.postgres.sql
```

**Fra dit lokale terminal:**
```bash
# 1. Download schema
curl https://raw.githubusercontent.com/martinjensen9988-sudo/lejio-fri/main/database/schema.postgres.sql > schema.sql

# 2. Kør migration
psql postgresql://postgres:PASSWORD@HOST:5432/lejio_fri < schema.sql
```

---

## 📱 Environment Variables Reference

### Required Variables
```
DB_HOST              → PostgreSQL Host
DB_PORT              → 5432 (standard)
DB_NAME              → lejio_fri
DB_USER              → postgres
DB_PASSWORD          → Your secure password
DB_SSL               → true
NODE_ENV             → production
PORT                 → 3000 (Render default)
```

### Optional Variables (hvis du bruger Supabase auth)
```
VITE_SUPABASE_URL      → https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY → your-anon-key
```

### Optional (hvis du bruger Azure Blob Storage)
```
VITE_AZURE_STORAGE_ACCOUNT    → your-account
VITE_AZURE_STORAGE_CONTAINER  → your-container
VITE_AZURE_STORAGE_SAS_URL    → your-sas-url
```

---

## 🚨 Common Issues & Fixes

### Issue 1: Build Failed - "pg not found"
**Fix:** Sørg for at api/package.json har `"pg": "^8.10.0"`
```bash
cd api && npm install pg
```

### Issue 2: Database Connection Error
**Fix:** Check at miljøvariable er korrekte
```bash
# Test connection locally
DB_HOST=your-host npm start
```

### Issue 3: "Port Already In Use"
**Fix:** Render bruger PORT env var - det bør være sæt automatisk

### Issue 4: "Cannot find module '../dist/index.html'"
**Fix:** Sørg for at `npm run build` kører først
```bash
npm run build  # Skal generere ./dist folder
npm start
```

---

## 🔄 Database Backup & Migration from Azure

### Eksportér fra Azure SQL:
```powershell
# Eksportér schema
sqlcmd -S tcp:lejio-fri-db.database.windows.net,1433 -U martin_lejio_user `
  -d lejio_fri -C -Q "SELECT * FROM fri_vehicles" -o vehicles_backup.csv
```

### Importer til PostgreSQL:
```bash
# PostgreSQL copy command
psql postgresql://user:pass@host:5432/lejio_fri -c "COPY fri_vehicles FROM '/path/to/vehicles_backup.csv'"
```

---

## 📊 Pricing (Monthly)

| Service | Tier | Price |
|---------|------|-------|
| **Web Service** | Standard | $7 |
| **PostgreSQL** | Standard (up to 1GB) | $15 |
| **Bandwidth** | Per GB | ~$0.10/GB |
| **TOTAL** | | ~$22-30/month |

---

## 🔒 Security Checklist

- [x] PostgreSQL bruger et stærk password
- [x] Allow list konfigureret (hvis nødvendigt)
- [x] SSL connection enabled
- [x] Environment variables sikret (ikke i .git)
- [x] Database backups aktiveret

---

## 📚 Database Schema Files

| File | Link | Description |
|------|------|-------------|
| **PostgreSQL Schema** | `database/schema.postgres.sql` | Komplet PostgreSQL schema |
| **Database Diagram** | `LEJIO_FRI_ARCHITECTURE.md` | Database relationer |
| **Migration Scripts** | `database/` folder | Setup scripts |

---

## 🎯 Next Steps

1. **Lokal Test** (for du deployer)
   ```bash
   npm install
   npm run build
   npm start
   ```

2. **Deploy til Render**
   - Follow Steps 1-6 ovenfor
   - Eller klik **"Deploy"** knappen i Render UI

3. **Post-Deploy**
   - Konfigurer custom domain (hvis ønsket)
   - Setup monitoring/alerts
   - Configure SSL (automatisk via Render)

---

## 📞 Support & Troubleshooting

- **Render Docs:** https://render.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express Docs:** https://expressjs.com/

Hvis du har problemer, check:
1. Deploy logs i Render dashboard
2. Environment variables er korrekte
3. Database connection string
4. Firewall/IP allow list

---

**🎉 Ready to Deploy?**

Go to Render Dashboard and start deploying! Your app will be live in minutes.
