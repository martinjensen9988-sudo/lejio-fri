// Main server for Render deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API routes - import all API handlers
const apiRoutes = {
  '/api/get-vehicles': require('./GetVehicles/index.js'),
  '/api/get-bookings': require('./GetBookings/index.js'),
  '/api/create-vehicle': require('./CreateVehicle/index.js'),
  '/api/update-vehicle': require('./UpdateVehicle/index.js'),
  '/api/delete-vehicle': require('./DeleteVehicle/index.js'),
  '/api/get-invoices': require('./GetInvoices/index.js'),
  '/api/get-lessor-stats': require('./GetLessorStats/index.js'),
  '/api/auth-login': require('./AuthLogin/index.js'),
  '/api/auth-signup': require('./AuthSignup/index.js'),
  '/api/auth-me': require('./AuthMe/index.js'),
  '/api/auth-logout': require('./AuthLogout/index.js'),
  '/api/auth-session': require('./AuthSession/index.js'),
  '/api/get-modules': require('./GetModules/index.js'),
  '/api/set-module': require('./SetModule/index.js'),
  '/api/get-pages': require('./GetPages/index.js'),
  '/api/create-page': require('./CreatePage/index.js'),
  '/api/update-page': require('./UpdatePage/index.js'),
  '/api/delete-page': require('./DeletePage/index.js'),
  '/api/get-page-blocks': require('./GetPageBlocks/index.js'),
  '/api/create-page-block': require('./CreatePageBlock/index.js'),
  '/api/delete-page-block': require('./DeletePageBlock/index.js'),
  '/api/tenant': require('./Tenant/index.js'),
};

// Register API routes - convert Azure Functions format to Express
Object.entries(apiRoutes).forEach(([path, handler]) => {
  app.get(path, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${path}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post(path, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${path}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put(path, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${path}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(path, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${path}:`, error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Serve React app for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LEJIO FRI server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  process.exit(0);
});
