import fs from 'node:fs';
import path from 'node:path';
import sql from 'mssql';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations', 'azure-sql');
const envFile = path.join(process.cwd(), '.env.azure');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value.replace(/^"|"$/g, '');
    }
  });
}

loadEnvFile(envFile);

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  }
};

function splitBatches(sqlText) {
  return sqlText
    .split(/^[\t ]*GO[\t ]*$/gim)
    .map((batch) => batch.trim())
    .filter(Boolean);
}

async function runMigrations() {
  if (!config.server || !config.database || !config.authentication.options.userName || !config.authentication.options.password) {
    throw new Error('Missing DB connection env vars. Ensure DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD are set.');
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migrations found.');
    return;
  }

  const pool = await sql.connect(config);

  try {
    for (const file of files) {
      const fullPath = path.join(migrationsDir, file);
      const sqlText = fs.readFileSync(fullPath, 'utf8');
      const batches = splitBatches(sqlText);
      if (batches.length === 0) continue;

      console.log(`Applying ${file}...`);
      for (const batch of batches) {
        await pool.request().batch(batch);
      }
      console.log(`✔ ${file}`);
    }
  } finally {
    await pool.close();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
