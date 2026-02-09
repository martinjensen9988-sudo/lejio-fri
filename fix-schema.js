import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  host: 'dpg-d6298k2g5rbc73f1k04g-a.frankfurt-postgres.render.com',
  user: 'lejio_fri_db_user',
  password: 'F6TnsEAtqSG2o5FF2PTLgCvzB4ZyaHcQ',
  database: 'lejio_fri_db',
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixSchema() {
  try {
    console.log('🔧 Applying database schema fixes...\n');

    // Add subscription_tier
    try {
      await pool.query(
        `ALTER TABLE fri_lessors ADD COLUMN subscription_tier VARCHAR(50)`
      );
      console.log('✓ Added subscription_tier column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⊘ subscription_tier column already exists');
      } else {
        throw err;
      }
    }

    // Add created_at
    try {
      await pool.query(
        `ALTER TABLE fri_lessors ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
      );
      console.log('✓ Added created_at column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⊘ created_at column already exists');
      } else {
        throw err;
      }
    }

    // Add updated_at
    try {
      await pool.query(
        `ALTER TABLE fri_lessors ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP`
      );
      console.log('✓ Added updated_at column');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('⊘ updated_at column already exists');
      } else {
        throw err;
      }
    }

    // Verify columns exist
    const result = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'fri_lessors' 
      AND column_name IN ('subscription_tier', 'selected_modules', 'created_at', 'updated_at')
      ORDER BY column_name
    `);

    console.log('\n✅ Schema verification:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`);
    });

    console.log('\n✅ All schema fixes applied successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixSchema();
