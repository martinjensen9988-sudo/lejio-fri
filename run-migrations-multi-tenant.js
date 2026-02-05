#!/usr/bin/env node

// Multi-tenant migration runner using Azure SDK
import { DefaultAzureCredential } from '@azure/identity';
import { SqlClient } from 'mssql';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SQL_SERVER = process.env.SQL_SERVER || 'sql-vqiibdafjcmnc-dev.database.windows.net';
const SQL_DATABASE = process.env.SQL_DATABASE || 'lejio-fri';
const SQL_USERNAME = process.env.SQL_USERNAME || 'sqladmin';
const SQL_PASSWORD = process.env.SQL_PASSWORD;

if (!SQL_PASSWORD) {
  console.error('❌ Error: SQL_PASSWORD environment variable not set');
  process.exit(1);
}

async function runMigrations() {
  const pool = new SqlClient.ConnectionPool({
    server: SQL_SERVER,
    database: SQL_DATABASE,
    authentication: {
      type: 'default',
      options: {
        userName: SQL_USERNAME,
        password: SQL_PASSWORD,
      },
    },
    options: {
      trustServerCertificate: true,
      encrypt: true,
      connectTimeout: 15000,
    },
  });

  try {
    console.log('🔗 Connecting to Azure SQL Database...');
    console.log(`   Server: ${SQL_SERVER}`);
    console.log(`   Database: ${SQL_DATABASE}`);
    console.log(`   User: ${SQL_USERNAME}`);
    
    await pool.connect();
    console.log('✅ Connected successfully\n');

    // Migration files
    const migrations = [
      '002_multi_tenant_schema.sql',
      '007_multi_tenant_test_data.sql',
    ];

    for (const migrationFile of migrations) {
      const filePath = path.join(__dirname, 'supabase/migrations/azure-sql', migrationFile);
      
      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️  File not found: ${filePath}`);
        continue;
      }

      console.log(`📄 Running migration: ${migrationFile}`);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        const request = pool.request();
        // Split by GO statements (T-SQL batch separator)
        const batches = sql.split(/^\s*GO\s*$/gm).filter(batch => batch.trim());
        
        for (let i = 0; i < batches.length; i++) {
          const batch = batches[i].trim();
          if (batch) {
            await pool.request().query(batch);
          }
        }
        
        console.log(`✅ Completed: ${migrationFile}\n`);
      } catch (error) {
        console.error(`❌ Error in ${migrationFile}:`, error.message);
        console.error(error);
        // Continue with next migration
      }
    }

    console.log('✅ All migrations processed!');
    console.log('\nNext steps:');
    console.log('1. Verify database schema: SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = \'dbo\'');
    console.log('2. Check tenant data: SELECT * FROM fri_tenants');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    try {
      await pool.close();
      console.log('\n🔌 Connection closed');
    } catch (e) {
      console.error('Error closing connection:', e.message);
    }
  }
}

// Run migrations
runMigrations().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
