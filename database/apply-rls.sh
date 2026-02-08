#!/bin/bash
# Apply RLS policies to Render Postgres database
# Usage: ./database/apply-rls.sh [DATABASE_URL]

set -e

# Get database URL from argument or environment
DB_URL="${1:-$DATABASE_URL}"

if [ -z "$DB_URL" ]; then
  echo "❌ ERROR: Database URL not provided"
  echo ""
  echo "Usage:"
  echo "  ./database/apply-rls.sh postgresql://user:pass@host:port/dbname"
  echo "  OR set DATABASE_URL environment variable"
  echo ""
  exit 1
fi

echo "🔐 Applying RLS policies to LEJIO FRI database..."
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RLS_FILE="$SCRIPT_DIR/rls.policies.sql"

if [ ! -f "$RLS_FILE" ]; then
  echo "❌ ERROR: rls.policies.sql not found at $RLS_FILE"
  exit 1
fi

echo "📁 RLS script: $RLS_FILE"
echo "🗄️  Database: ${DB_URL:0:30}..."
echo ""

# Apply RLS policies
echo "⚙️  Applying RLS policies..."
psql "$DB_URL" -f "$RLS_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ RLS policies applied successfully!"
  echo ""
  echo "🔍 Verifying RLS is enabled..."
  
  # Verify RLS is enabled
  psql "$DB_URL" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'fri_%' ORDER BY tablename;"
  
  echo ""
  echo "📊 Checking policy count..."
  psql "$DB_URL" -c "SELECT COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public';"
  
  echo ""
  echo "✅ RLS deployment complete!"
  echo ""
  echo "Next steps:"
  echo "  1. Test data isolation between lessors"
  echo "  2. Monitor server logs for RLS errors"
  echo "  3. Verify subscription/module endpoints work correctly"
else
  echo ""
  echo "❌ RLS deployment failed!"
  exit 1
fi
