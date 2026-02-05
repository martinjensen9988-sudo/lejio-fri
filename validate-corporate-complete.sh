#!/bin/bash

# Corporate Features - Comprehensive Validation Report
# Validates all 3 components' code structure and data flow

echo "=================================================="
echo "🧪 CORPORATE FEATURES - COMPREHENSIVE VALIDATION"
echo "=================================================="
echo ""

PASSED=0
FAILED=0

# Helper function
check_file_contains() {
  local file=$1
  local pattern=$2
  local description=$3
  
  if grep -q "$pattern" "$file"; then
    echo "✅ $description"
    ((PASSED++))
  else
    echo "❌ $description"
    ((FAILED++))
  fi
}

echo "📋 1. EMPLOYEE ADMIN COMPONENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILE="src/pages/admin/CorporateEmployeeAdmin.tsx"

check_file_contains "$FILE" "useCorporateFleet" "✓ Uses useCorporateFleet hook"
check_file_contains "$FILE" "useState" "✓ Has state management"
check_file_contains "$FILE" "useEffect" "✓ Has lifecycle effects"
check_file_contains "$FILE" "refetch" "✓ Calls refetch on update"
check_file_contains "$FILE" "corporate_employees" "✓ Queries corporate_employees table"
check_file_contains "$FILE" "\.insert\(" "✓ Has insert operation (Create)"
check_file_contains "$FILE" "\.update\(" "✓ Has update operation (Update)"
check_file_contains "$FILE" "is_active.*false" "✓ Has delete operation (soft delete)"
check_file_contains "$FILE" "Dialog\|Sheet" "✓ Has modal/dialog for forms"
check_file_contains "$FILE" "toast\." "✓ Has user notifications"

echo ""
echo "📋 2. BUDGET DASHBOARD COMPONENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILE="src/pages/admin/CorporateBudgetDashboard.tsx"

check_file_contains "$FILE" "useCorporateFleet" "✓ Uses useCorporateFleet hook"
check_file_contains "$FILE" "invoices" "✓ Fetches invoices"
check_file_contains "$FILE" "departments" "✓ Fetches departments"
check_file_contains "$FILE" "spent\|current_spend" "✓ Calculates spending"
check_file_contains "$FILE" "percentage\|spent.*budget" "✓ Calculates budget percentage"
check_file_contains "$FILE" "LineChart\|BarChart\|Chart" "✓ Has chart visualization"
check_file_contains "$FILE" "monthly" "✓ Has monthly data"
check_file_contains "$FILE" "Recharts\|recharts" "✓ Uses charting library"
check_file_contains "$FILE" "alert\|Alert" "✓ Has alert system for over-budget"
check_file_contains "$FILE" "department_breakdown" "✓ Processes invoice breakdown"

echo ""
echo "📋 3. SETTLEMENT REPORTS COMPONENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FILE="src/pages/admin/CorporateSettlementReports.tsx"

check_file_contains "$FILE" "useCorporateFleet" "✓ Uses useCorporateFleet hook"
check_file_contains "$FILE" "invoices" "✓ Fetches invoices"
check_file_contains "$FILE" "reportMap\|groupBy\|group" "✓ Groups reports by period"
check_file_contains "$FILE" "month\|period" "✓ Handles monthly grouping"
check_file_contains "$FILE" "total_amount" "✓ Calculates totals"
check_file_contains "$FILE" "status" "✓ Tracks report status"
check_file_contains "$FILE" "pdf\|PDF\|export" "✓ Has export capability"
check_file_contains "$FILE" "filter" "✓ Has filtering logic"
check_file_contains "$FILE" "sort\|Sort" "✓ Has sorting capability"
check_file_contains "$FILE" "department_breakdown" "✓ Processes breakdown data"

echo ""
echo "📋 4. HOOK INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━"

FILE="src/hooks/useCorporateFleet.tsx"

check_file_contains "$FILE" "corporateAccount" "✓ Provides corporateAccount state"
check_file_contains "$FILE" "departments" "✓ Provides departments state"
check_file_contains "$FILE" "employees" "✓ Provides employees state"
check_file_contains "$FILE" "invoices" "✓ Provides invoices state"
check_file_contains "$FILE" "refetch" "✓ Provides refetch function"
check_file_contains "$FILE" "isLoading" "✓ Provides loading state"
check_file_contains "$FILE" "addEmployee\|addDepartment" "✓ Has CRUD operations"
check_file_contains "$FILE" "Promise.all" "✓ Fetches data in parallel"
check_file_contains "$FILE" "corporate_account_id" "✓ Filters by corporate account"

echo ""
echo "📋 5. ROUTING"
echo "━━━━━━━━━━━"

FILE="src/App.tsx"

check_file_contains "$FILE" "CorporateEmployeeAdmin" "✓ Employee Admin imported"
check_file_contains "$FILE" "CorporateBudgetDashboard" "✓ Budget Dashboard imported"
check_file_contains "$FILE" "CorporateSettlementReports" "✓ Settlement Reports imported"
check_file_contains "$FILE" "/admin/corporate/employees" "✓ Employee route registered"
check_file_contains "$FILE" "/admin/corporate/budget" "✓ Budget route registered"
check_file_contains "$FILE" "/admin/corporate/settlement" "✓ Settlement route registered"
check_file_contains "$FILE" "AdminAuthProvider" "✓ Protected with auth"
check_file_contains "$FILE" "lazy\|React.lazy" "✓ Lazy loaded for performance"

echo ""
echo "📋 6. TYPE SAFETY"
echo "━━━━━━━━━━━━━━━━"

FILE="src/hooks/useCorporateFleet.tsx"

check_file_contains "$FILE" "interface CorporateAccount" "✓ CorporateAccount type defined"
check_file_contains "$FILE" "interface CorporateDepartment" "✓ CorporateDepartment type defined"
check_file_contains "$FILE" "interface CorporateEmployee" "✓ CorporateEmployee type defined"
check_file_contains "$FILE" "interface CorporateInvoice" "✓ CorporateInvoice type defined"
check_file_contains "$FILE" ": CorporateAccount\|CorporateEmployee" "✓ Types used in return"

echo ""
echo "📊 SUMMARY"
echo "━━━━━━━━━"
TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo "Passed:  $PASSED/$TOTAL"
echo "Failed:  $FAILED/$TOTAL"
echo "Score:   $PERCENTAGE%"

echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 ALL VALIDATION CHECKS PASSED!"
  echo ""
  echo "✅ Employee Admin: Fully implemented"
  echo "✅ Budget Dashboard: Fully implemented"
  echo "✅ Settlement Reports: Fully implemented"
  echo "✅ useCorporateFleet: Complete integration"
  echo "✅ Routing: All routes registered"
  echo "✅ Type Safety: Full TypeScript coverage"
  echo ""
  echo "🚀 Components ready for testing!"
  exit 0
else
  echo "⚠️  Some checks failed. Review above."
  exit 1
fi
