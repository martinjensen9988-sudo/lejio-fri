# API - PostgreSQL & Express Migration Guide

## Overview

API'erne er migreret fra Azure Functions + mssql til Express + PostgreSQL.

### Før (Azure Functions)
- mssql library for Azure SQL
- Azure runtime
- Serverless functions
- Manual deployment

### Nu (Express + PostgreSQL)
- pg library for PostgreSQL
- Express server
- Node.js runtime
- Deployed on Render

---

## File Structure

```
api/
├── db.js                    ← PostgreSQL connection pool
├── server.js                ← Express server (entry point)
├── package.json             ← Dependencies (pg, express, cors)
├── GetVehicles/
│   └── index.js            ← ✅ Converted to PostgreSQL
├── GetBookings/
│   └── index.js            ← ✅ Converted to PostgreSQL
├── CreateVehicle/
│   └── index.js            ← ✅ Converted to PostgreSQL
├── UpdateVehicle/
│   └── index.js            ← ✅ Converted to PostgreSQL
└── [20+ more endpoints]
```

---

## Connection Pool (db.js)

Alle endpoints bruger samme connection pool for bedre performance:

```javascript
const pool = require('../db.js');

// Usage
const result = await pool.query(
  'SELECT * FROM fri_vehicles WHERE lessor_id = $1',
  [lessorId]
);

// Result format:
// result.rows     - Array of rows
// result.rowCount - Number of rows affected
```

---

## Converting Endpoints

### Automatic Conversion
```bash
node ../scripts/convert-mssql-to-pg.js
```

This will convert all mssql endpoints to PostgreSQL automatically.

### Manual Conversion Steps

1. Replace mssql with pg:
```javascript
// ❌ Before
const sql = require('mssql');
const config = { server: ..., };
let pool = await sql.connect(config);

// ✅ After
const pool = require('../db.js');
// No config needed - uses env variables
```

2. Replace parameterized queries:
```javascript
// ❌ Before
.input('lessorId', sql.UniqueIdentifier, lessor_id)
.query('SELECT * FROM fri_vehicles WHERE lessor_id = @lessorId')

// ✅ After
pool.query(
  'SELECT * FROM fri_vehicles WHERE lessor_id = $1',
  [lessor_id]
)
```

3. Replace result handling:
```javascript
// ❌ Before
result.recordset         // Array of rows

// ✅ After
result.rows             // Array of rows
result.rowCount         // Number of affected rows
```

---

## Environment Variables

Set these in your `.env` file:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lejio_fri
DB_USER=postgres
DB_PASSWORD=your-password
DB_SSL=false        # for local development
```

For Render production:
```
DB_HOST=xxx.c.rendering.com
DB_PORT=5432
DB_NAME=lejio_fri
DB_USER=postgres
DB_PASSWORD=secure-password
DB_SSL=true
```

---

## Testing Locally

```bash
# 1. Install dependencies
npm install

# 2. Copy template env
cp ../.env.render.example ../.env.render

# 3. Update .env.render with local PostgreSQL credentials

# 4. Run server
npm start
# or from root: npm run server

# 5. Test endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/get-vehicles?lessor_id=test-123
```

---

## Endpoint Format

All endpoints follow this Azure Functions format (now adapted for Express):

```javascript
module.exports = async function (context, req) {
  context.res.headers = { "Content-Type": "application/json" };
  
  try {
    // Your logic
    context.res.status = 200;
    context.res.body = { data: result };
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
  }
};
```

The Express server maps these to HTTP routes automatically.

---

## Available Endpoints

### Vehicles
- `GET /api/get-vehicles?lessor_id=xxx`
- `POST /api/create-vehicle`
- `PUT /api/update-vehicle`
- `DELETE /api/delete-vehicle`

### Bookings
- `GET /api/get-bookings?lessor_id=xxx`

### Invoices
- `GET /api/get-invoices?lessor_id=xxx`

### Pages (CMS)
- `GET /api/get-pages?lessor_id=xxx`
- `POST /api/create-page`
- `PUT /api/update-page`
- `DELETE /api/delete-page`

### Authentication
- `POST /api/auth-login`
- `POST /api/auth-signup`
- `POST /api/auth-logout`
- `GET /api/auth-me`
- `GET /api/auth-session`

### Stats
- `GET /api/get-lessor-stats?lessor_id=xxx`

---

## Database Schema

PostgreSQL schema is defined in `../database/schema.postgres.sql`

Key tables:
- `fri_vehicles` - Vehicle listings
- `fri_bookings` - Reservations
- `fri_invoices` - Billing
- `fri_lessors` - Business accounts
- `fri_support_tickets` - Support system

Run migrations:
```bash
psql postgresql://user:pass@host/lejio_fri < ../database/schema.postgres.sql
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "error": "Description of what went wrong",
  "status": 400
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (missing fields)
- `403` - Unauthorized (not owner)
- `500` - Server error

---

## Performance Tips

1. **Connection pooling** - db.js handles this automatically
2. **Lazy loading** - Require endpoint handlers only when needed
3. **Caching** - Consider implementing Redis for frequently accessed data
4. **Indexes** - PostgreSQL schema includes indexes on common queries

---

## Deployment

See `../RENDER_DEPLOYMENT_GUIDE.md` for full deployment instructions.

Quick version:
1. Push to GitHub
2. Render auto-deploys on push
3. Database migrations run manually via Render console

---

## Troubleshooting

**Q: "Cannot find module 'pg'"**
A: Run `npm install pg` in api/ folder

**Q: "Database connection error"**
A: Check DB_HOST, DB_USER, DB_PASSWORD environment variables

**Q: "Port 3000 already in use"**
A: Change PORT env variable or kill process on port 3000

**Q: "Cannot GET /api/get-vehicles"**
A: Make sure server.js is running and endpoint handler exists

---

## Next Steps

1. ✅ Run conversion script: `node ../scripts/convert-mssql-to-pg.js`
2. ✅ Test locally: `npm start`
3. ✅ Deploy to Render
4. ✅ Migrate database
5. ✅ Monitor and maintain

---

**Ready to deploy?** See `../RENDER_DEPLOYMENT_GUIDE.md`
