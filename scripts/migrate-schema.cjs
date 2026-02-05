#!/usr/bin/env node
// Migrate PostgreSQL schema
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'dpg-d6298k2g5rbc73f1k04g-a',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lejio_fri_db',
  user: process.env.DB_USER || 'lejio_fri_db_user',
  password: process.env.DB_PASSWORD || 'F6TnsEAtqSG2o5FF2PTLgCvzB4ZyaHcQ',
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('📦 Reading schema file...');
    const schema = fs.readFileSync('./database/schema.postgres.sql', 'utf-8');
    
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    console.log('⏳ Executing schema migration...');
    await client.query(schema);
    
    console.log('✅ Schema migration completed successfully!');
    client.release();
    
    // Test connection
    const result = await pool.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\'');
    console.log(`📊 Created tables: ${result.rows.length}`);
    result.rows.forEach(row => console.log(`   ✓ ${row.table_name}`));
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

migrate();
