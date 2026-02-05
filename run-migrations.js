import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://aqzggwewjttbkaqnbmrb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  console.error('Please set the service role key to run migrations');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    console.log('🚀 Running Supabase migrations...\n');

    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.startsWith('20260126_') && f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`📝 Running: ${file}`);
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`❌ Error in ${file}:`, error.message);
        continue;
      }
      
      console.log(`✅ ${file} completed\n`);
    }

    console.log('✨ All migrations completed!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigrations();
