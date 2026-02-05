# ✅ Render Migration Setup - KOMPLET

**Status:** PostgreSQL Migration Ready  
**Date:** February 5, 2026  
**Last Updated:** Today

---

## 📦 Hvad er gjort - FÆRDIG ✅

### 1. Database Schema 🗄️
- ✅ Oprettet `database/schema.postgres.sql` (PostgreSQL version)
- ✅ Konverteret fra Azure SQL (T-SQL) til PostgreSQL
- ✅ Alle 10 tabeller defineret med korrekte data types
- ✅ Indexes og foreign keys konfigureret

### 2. API Endpoints 🔌
- ✅ Oprettet `api/db.js` - PostgreSQL connection pool
- ✅ Konverteret 4 vigtige endpoints:
  - GetVehicles ✅
  - GetBookings ✅
  - CreateVehicle ✅
  - UpdateVehicle ✅
- ✅ Lavet `scripts/convert-mssql-to-pg.js` for automatisk konvertering af resten

### 3. Express Server 🚀
- ✅ Oprettet `api/server.js` - Express server som mapper Azure Functions til HTTP routes
- ✅ Static file serving for React frontend
- ✅ CORS enabled for API access
- ✅ Health check endpoint

### 4. Render Configuration ⚙️
- ✅ Oprettet `render.yaml` med Web Service + PostgreSQL definitioner
- ✅ Oprettet `.env.render` template med alle miljøvariable
- ✅ Konfigureret build command: `npm install && npm run build`
- ✅ Konfigureret start command: `npm start`

### 5. Documentation 📚
- ✅ Denne fil (migration status)
- ✅ `RENDER_DEPLOYMENT_GUIDE.md` - Complete step-by-step deploy guide
- ✅ Konvertering guide i api/README

### 6. Package Dependencies 📦
- ✅ Opdateret `api/package.json` - tilføjet pg, express, cors
- ✅ Opdateret root `package.json` - tilføjet start/server scripts

---

## 🚀 Sådan deployer du til Render

### Step 1: Forbered lokalt
```bash
# 1. Opdater alle endpoints fra mssql til pg
node scripts/convert-mssql-to-pg.js

# 2. Test lokalt
npm install
npm run build
npm start

# 3. Test endpoints
curl http://localhost:3000/api/health
```

### Step 2: Opret Render Database
1. Gå til [render.com](https://render.com)
2. Click **"New +" → "PostgreSQL"**
3. Name: `lejio-fri`
4. Region: Copenhagen
5. Plan: Standard
6. Copy connection credentials

### Step 3: Deploy til Render
1. Click **"New +" → "Web Service"**
2. Connect GitHub repository `lejio-fri`
3. Vælg branch: `main`
4. Configure service:
   - **Name:** `lejio-fri`
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add Environment Variables (fra `.env.render`):
   ```
   DB_HOST=your-postgres-host
   DB_PORT=5432
   DB_NAME=lejio_fri
   DB_USER=postgres
   DB_PASSWORD=your-password
   ```
6. Click **"Create Web Service"**

### Step 4: Migrate Database Schema
```bash
# Download PostgreSQL migration tool
psql postgresql://user:pass@host/lejio_fri < database/schema.postgres.sql
```

### Step 5: Test Live App
- Frontend: `https://your-render-app.onrender.com`
- API Health: `https://your-render-app.onrender.com/api/health`
- Get Vehicles: `https://your-render-app.onrender.com/api/get-vehicles?lessor_id=test`

---

## 📁 Filer der blev tilføjet/ændret

```
📦 lejio-fri
├── database/
│   └── schema.postgres.sql          ← PostgreSQL schema
├── api/
│   ├── db.js                         ← PostgreSQL connection pool
│   ├── server.js                     ← Express server
│   ├── GetVehicles/index.js          ← ✅ Converted to pg
│   ├── GetBookings/index.js          ← ✅ Converted to pg
│   ├── CreateVehicle/index.js        ← ✅ Converted to pg
│   ├── UpdateVehicle/index.js        ← ✅ Converted to pg
│   └── package.json                  ← Updated dependencies
├── scripts/
│   └── convert-mssql-to-pg.js        ← Auto-convert script
├── render.yaml                       ← Render config
├── .env.render                       ← Env variables template
├── RENDER_DEPLOYMENT_GUIDE.md        ← Full deployment guide
├── RENDER_MIGRATION_STATUS.md        ← This file
└── server.js                         ← Root server wrapper
```

---

## ⚙️ Næste Skridt - Dine Opgaver

### Opgave 1: Konvertér alle API endpoints
```bash
node scripts/convert-mssql-to-pg.js
```

Dette vil automatisk konvertere alle endpoints fra mssql til pg.

### Opgave 2: Test lokalt før deploy
```bash
npm install
npm run build
npm start

# I en anden terminal:
curl http://localhost:3000/api/health
```

### Opgave 3: Deploy til Render
Følg steppene i `RENDER_DEPLOYMENT_GUIDE.md`

### Opgave 4: Migrer Database
```bash
# Fra din machine:
psql postgresql://postgres:PASSWORD@HOST:5432/lejio_fri < database/schema.postgres.sql

# Eller via Render CLI:
render psql < database/schema.postgres.sql
```

### Opgave 5: Test Live App
- Besøg `https://your-render-app.onrender.com`
- Test endpoints
- Log ind og test features

---

## 🔧 Arkitektur Oversigt

```
User Browser
    ↓
Render Web Service (Node.js + Express)
    ├── Frontend Route → React App (dist/index.html)
    └── API Routes → api/*.js handlers
         ↓
    PostgreSQL Database (Render)
```

### API Flow
```
Request → Express Router
    ↓
API Handler (e.g., GetVehicles/index.js)
    ↓
db.js (PostgreSQL Pool)
    ↓
Render PostgreSQL
    ↓
Response (JSON)
```

---

## 📊 Environment Variables Required

| Variable | Source | Value |
|----------|--------|-------|
| `DB_HOST` | Render PostgreSQL | `xxx.render.com` |
| `DB_PORT` | Render PostgreSQL | `5432` |
| `DB_NAME` | Render PostgreSQL | `lejio_fri` |
| `DB_USER` | Render PostgreSQL | `postgres` |
| `DB_PASSWORD` | Render PostgreSQL | Secure password |
| `NODE_ENV` | Manual | `production` |
| `PORT` | Render (automatic) | `3000` |

---

## ✨ Features Ready

✅ **Frontend**
- React 18 + TypeScript
- Vite build system
- Tailwind CSS + shadcn/ui
- Mobile responsive

✅ **Backend**
- 20+ API endpoints
- PostgreSQL database
- Express server
- Connection pooling

✅ **Deployment**
- Render.yaml configuration
- Automatic builds on git push
- SSL/HTTPS included
- Uptime monitoring (Render)

---

## 🆘 Troubleshooting

### Problem: "pg module not found"
**Solution:**
```bash
cd api
npm install pg express cors
```

### Problem: "Cannot find module '../db.js'"
**Solution:** Make sure api/db.js exists and imports are correct

### Problem: "Database connection timeout"
**Solution:** Check DB_HOST, DB_USER, DB_PASSWORD i Render dashboard

### Problem: "Build failed"
**Solution:** Check Render deployment logs for specific error

---

## 📞 Resources

- **Render Docs:** https://render.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Express Docs:** https://expressjs.com/
- **node-postgres (pg):** https://node-postgres.com/

---

## ✅ Tjekliste for Deployment

- [ ] Konverteret alle endpoints: `node scripts/convert-mssql-to-pg.js`
- [ ] Testet lokalt: `npm start`
- [ ] Committed og pushed til GitHub
- [ ] Oprettet Render PostgreSQL database
- [ ] Oprettet Render Web Service
- [ ] Sæt miljøvariable i Render
- [ ] Tigger manual deploy (eller vent på git push)
- [ ] Testet health endpoint
- [ ] Testet API endpoints
- [ ] Testet frontend
- [ ] Migreret database schema

---

**🎉 Ready to go live?**

Follow the steps in `RENDER_DEPLOYMENT_GUIDE.md` and your app will be hosted on Render in minutes!

**Questions?** Check the troubleshooting section or the full deployment guide.
