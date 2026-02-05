// Main server for Render deployment
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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

// API routes - dynamically load all API handlers that exist
const fs = require('fs');
const apiRoutes = {};
const apiDir = __dirname;
const dirs = fs.readdirSync(apiDir);

dirs.forEach(dir => {
  const dir_path = path.join(apiDir, dir);
  const stat = fs.statSync(dir_path);
  
  // Only process directories that have an index.js file
  if (stat.isDirectory() && fs.existsSync(path.join(dir_path, 'index.js'))) {
    // Convert directory name to kebab-case for route
    const routeName = dir
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/^-/, '');
    
    try {
      apiRoutes[`/api/${routeName}`] = require(`./${dir}/index.js`);
      console.log(`✓ Loaded API route: /api/${routeName}`);
    } catch (err) {
      console.warn(`✗ Failed to load /api/${routeName}:`, err.message);
    }
  }
});

// Register API routes - convert Azure Functions format to Express
Object.entries(apiRoutes).forEach(([routePath, handler]) => {
  app.get(routePath, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${routePath}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post(routePath, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${routePath}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.put(routePath, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${routePath}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete(routePath, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params });
      res.status(context.res.status || 200);
      Object.entries(context.res.headers || {}).forEach(([key, value]) => {
        res.set(key, value);
      });
      res.json(context.res.body);
    } catch (error) {
      console.error(`Error in ${routePath}:`, error);
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
