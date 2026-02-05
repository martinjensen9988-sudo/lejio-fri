#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import sql from 'mssql';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Connection string from user
const connectionString = 'Server=tcp:lejio-fri-db.database.windows.net,1433;Initial Catalog=lejio_fri;Persist Security Info=False;User ID=CloudSAf59bf0c5;Password=Luggen89;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;';

// Parse connection string to mssql config
function parseConnectionString(connStr) {
  const config = {};
  const parts = connStr.split(';');
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (key && value) {
      const trimmedKey = key.trim();
      const trimmedValue = value.trim();
      
      if (trimmedKey === 'Server') {
        const [server, port] = trimmedValue.replace('tcp:', '').split(',');
        config.server = server;
        config.port = parseInt(port) || 1433;
      } else if (trimmedKey === 'Initial Catalog') {
        config.database = trimmedValue;
      } else if (trimmedKey === 'User ID') {
        config.authentication = {
          type: 'default',
          options: {
            userName: trimmedValue,
            password: ''
          }
        };
      } else if (trimmedKey === 'Password') {
        if (!config.authentication) config.authentication = { type: 'default', options: {} };
        config.authentication.options.password = trimmedValue;
      } else if (trimmedKey === 'Encrypt') {
        config.options = config.options || {};
        config.options.encrypt = trimmedValue === 'True';
      } else if (trimmedKey === 'TrustServerCertificate') {
        config.options = config.options || {};
        config.options.trustServerCertificate = trimmedValue === 'True';
      } else if (trimmedKey === 'Connection Timeout') {
        config.options = config.options || {};
        config.options.connectTimeout = parseInt(trimmedValue) * 1000;
      }
    }
  });
  
  return config;
}

async function deployMigrations() {
  try {
    console.log('🔗 Connecting to Azure SQL Database...');
    const config = parseConnectionString(connectionString);
    
    console.log('🔗 Connecting to Azure SQL Database...');
    const pool = new sql.ConnectionPool(config);
    
    await pool.connect();
    console.log('✅ Connected!');
    
    // Migration files
    const migrationDir = path.join(__dirname, 'supabase/migrations/azure-sql');
    const migrations = [
      '001_initial_schema.sql',
      '002_security_policies.sql',
      '003_seed_data.sql'
    ];
    
    for (const migration of migrations) {
      const filePath = path.join(migrationDir, migration);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${migration} not found, skipping...`);
        continue;
      }
      
      console.log(`\n📝 Running ${migration}...`);
      const sql_content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const request = pool.request();
        // Split by GO statements (SQL Server batch separator)
        const batches = sql_content.split(/^\s*GO\s*$/gm);
        
        for (const batch of batches) {
          const trimmed = batch.trim();
          if (trimmed) {
            await request.query(trimmed);
          }
        }
        
        console.log(`✅ ${migration} completed!`);
      } catch (err) {
        console.error(`❌ Error in ${migration}:`, err.message);
        throw err;
      }
    }
    
    await pool.close();
    console.log('\n🎉 All migrations deployed successfully!');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Deployment failed:', err.message);
    process.exit(1);
  }
}

deployMigrations();
