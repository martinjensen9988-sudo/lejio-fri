#!/bin/bash

# Apply database migrations to fix schema

DB_HOST="dpg-d6298k2g5rbc73f1k04g-a.frankfurt-postgres.render.com"
DB_USER="lejio_fri_db_user"
DB_NAME="lejio_fri_db"
DB_PASS="F6TnsEAtqSG2o5FF2PTLgCvzB4ZyaHcQ"

echo "🔧 Applying database schema fixes..."

# Add subscription_tier column
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -X --no-psqlrc -q -c \
  "ALTER TABLE fri_lessors ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50);" 2>/dev/null && echo "✓ subscription_tier added" || echo "⊘ subscription_tier skipped (may already exist)"

# Add created_at column  
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -X --no-psqlrc -q -c \
  "ALTER TABLE fri_lessors ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;" 2>/dev/null && echo "✓ created_at added" || echo "⊘ created_at skipped"

# Add updated_at column
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -X --no-psqlrc -q -c \
  "ALTER TABLE fri_lessors ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;" 2>/dev/null && echo "✓ updated_at added" || echo "⊘ updated_at skipped"

echo "✅ Schema migrations complete!"
