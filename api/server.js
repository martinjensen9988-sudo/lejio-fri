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

// Determine correct dist path - try multiple locations
let distPath;
const possiblePaths = [
  '/opt/render/project/dist',                   // Render production (PRIORITY)
  '/opt/render/project/src/dist',               // Render if project is in src subdir
  path.resolve(__dirname, '../../dist'),        // From api/server.js going up 2 dirs to root
  path.resolve(__dirname, '../../src/dist'),    // From api/server.js going up to root, then src/dist
  path.resolve(__dirname, '../dist'),           // From api/server.js going up 1 dir (if server is in api/)
  path.resolve(process.cwd(), 'dist'),          // From current working directory
  path.resolve(process.cwd(), 'src/dist'),      // From current working directory src subdir
];

console.log(`🔍 Current working directory: ${process.cwd()}`);
console.log(`🔍 __dirname: ${__dirname}`);

for (const p of possiblePaths) {
  const indexPath = path.join(p, 'index.html');
  const exists = fs.existsSync(indexPath);
  console.log(`  - ${p}: ${exists ? '✅ EXISTS' : '❌ not found'}`);
  
  if (exists) {
    distPath = p;
    break;
  }
}

if (!distPath) {
  console.warn('⚠️  dist/index.html not found in any location. Will use fallback path.');
  console.warn('⚠️  This means static files and React app will NOT be served correctly.');
  distPath = possiblePaths[0];
}

console.log('📁 Serving static files from:', distPath);

// Verify dist directory exists and has files
try {
  const distContents = fs.readdirSync(distPath);
  console.log(`✅ dist/ directory has ${distContents.length} items`);
  
  const assetDir = path.join(distPath, 'assets');
  if (fs.existsSync(assetDir)) {
    const assetFiles = fs.readdirSync(assetDir);
    console.log(`✅ dist/assets/ directory has ${assetFiles.length} files`);
  }
} catch (err) {
  console.warn(`⚠️  Could not read dist directory: ${err.message}`);
}

// Serve static files with proper MIME types
app.use(express.static(distPath, {
  maxAge: '1d',
  etag: false,
  setHeaders: (res, path) => {
    // Ensure JS files are served with correct MIME type
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css; charset=utf-8');
    }
  }
}));

// LogMiddleware to see what's being requested
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    console.log(`📝 Request: ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database migration endpoint (admin)
app.post('/api/admin/migrate', async (req, res) => {
  try {
    const db = require('./db');
    const schemaPath = path.join(__dirname, '../database/schema.postgres.sql');
    
    // Check if schema file exists
    if (!fs.existsSync(schemaPath)) {
      return res.status(404).json({ error: 'Schema file not found' });
    }
    
    // Read and execute schema
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const client = await db.connect();
    
    try {
      await client.query(schema);
      client.release();
      
      // Get table count
      const result = await db.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
      res.json({ 
        success: true, 
        message: 'Database schema migrated successfully',
        tables_created: result.rows.length,
        tables: result.rows.map(r => r.table_name)
      });
    } catch (err) {
      client.release();
      throw err;
    }
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: 'Migration failed', details: err.message });
  }
});

// Fix for page builder FK constraint
app.post('/api/admin/fix-pages', async (req, res) => {
  try {
    const db = require('./db');
    
    // Drop and recreate fri_pages without FK constraint
    await db.query('DROP TABLE IF EXISTS fri_page_blocks CASCADE');
    await db.query('DROP TABLE IF EXISTS fri_pages CASCADE');
    
    await db.query(`
      CREATE TABLE fri_pages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lessor_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        meta_description TEXT,
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        published_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT uq_fri_page_slug UNIQUE (lessor_id, slug)
      )
    `);
    
    await db.query(`
      CREATE TABLE fri_page_blocks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL REFERENCES fri_pages(id) ON DELETE CASCADE,
        block_type VARCHAR(50) NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        config JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    res.json({ success: true, message: 'Page builder tables fixed' });
  } catch (err) {
    console.error('Fix pages error:', err);
    res.status(500).json({ error: 'Fix failed', details: err.message });
  }
});


// API routes - dynamically load all API handlers that exist
const apiRoutes = {};
const apiDir = __dirname;

// Skip these directories to avoid issues
const skipDirs = new Set(['node_modules', '.git', '.gitignore', 'dist', '.deployment', 'package.json', 'package-lock.json']);

try {
  const dirs = fs.readdirSync(apiDir);

  dirs.forEach(dir => {
    // Skip problematic directories
    if (skipDirs.has(dir) || dir.startsWith('.')) {
      return;
    }

    const dir_path = path.join(apiDir, dir);
    
    try {
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
    } catch (err) {
      console.warn(`✗ Failed to stat ${dir}:`, err.message);
    }
  });
} catch (err) {
  console.error('Error scanning API directory:', err.message);
}

// Register API routes - convert Azure Functions format to Express
Object.entries(apiRoutes).forEach(([routePath, handler]) => {
  app.get(routePath, async (req, res) => {
    const context = { res: { status: 200, headers: {}, body: {} } };
    try {
      await handler(context, { query: req.query, body: req.body, params: req.params, headers: req.headers });
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
      await handler(context, { query: req.query, body: req.body, params: req.params, headers: req.headers });
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
      await handler(context, { query: req.query, body: req.body, params: req.params, headers: req.headers });
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
      await handler(context, { query: req.query, body: req.body, params: req.params, headers: req.headers });
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
// But NOT for static assets - only HTML requests should get index.html
app.get('*', (req, res) => {
  // Skip serving index.html for static asset requests
  const assetExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.ico', '.map'];
  const isAssetRequest = assetExtensions.some(ext => req.path.endsWith(ext));
  
  if (isAssetRequest) {
    // This is a static asset request - let it 404 naturally
    return res.status(404).json({ error: 'Asset not found', path: req.path });
  }
  
  // This is likely a route request - serve index.html for SPA routing
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'index.html not found', path: indexPath });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LEJIO FRI server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST}`);
  console.log(`📁 Static files: ${distPath}`);
  
  // Check if dist/index.html exists
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    console.log(`✅ Found index.html at ${indexPath}`);
  } else {
    console.warn(`⚠️  index.html NOT found at ${indexPath}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  process.exit(0);
});
