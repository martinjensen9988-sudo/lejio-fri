#!/bin/bash

# Corporate Features - Validation Script
# Checks that all 3 components are properly integrated

echo "🔍 Corporate Features Integration Check"
echo "======================================="

# Check 1: Routes registered
echo -n "✓ Routes in App.tsx... "
if grep -q "corporate/employees\|corporate/budget\|corporate/settlement" src/App.tsx; then
  echo "OK"
else
  echo "MISSING"
  exit 1
fi

# Check 2: Components exist
echo -n "✓ Components exist... "
if [ -f "src/pages/admin/CorporateEmployeeAdmin.tsx" ] && [ -f "src/pages/admin/CorporateBudgetDashboard.tsx" ] && [ -f "src/pages/admin/CorporateSettlementReports.tsx" ]; then
  echo "OK"
else
  echo "MISSING"
  exit 1
fi

# Check 3: Hook exists
echo -n "✓ useCorporateFleet hook... "
if [ -f "src/hooks/useCorporateFleet.tsx" ]; then
  echo "OK"
else
  echo "MISSING"
  exit 1
fi

# Check 4: Build passes
echo -n "✓ Build status... "
if npm run build 2>&1 | grep -q "✓ built"; then
  echo "OK"
else
  echo "FAILED"
  exit 1
fi

echo ""
echo "✅ All integration checks passed!"
echo ""
echo "📍 Test URLs:"
echo "   http://localhost:5173/admin/corporate/employees"
echo "   http://localhost:5173/admin/corporate/budget"
echo "   http://localhost:5173/admin/corporate/settlement"
echo ""
echo "🧪 Next: Run 'npm run dev' and test each page"
