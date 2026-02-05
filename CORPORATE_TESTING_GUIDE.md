# Corporate Features - Quick Start Testing Guide

## Prerequisites
- Node.js and npm installed
- LEJIO dev environment set up
- Supabase project configured
- Admin account with access to `/admin` dashboard

## Starting the Dev Server

```bash
# Navigate to project
cd /workspaces/lejio-b75cff1f

# Install dependencies (if needed)
npm install

# Start dev server
npm run dev

# Output should show:
# VITE v... ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

## Accessing Corporate Features

### 1. Login to Admin Dashboard
1. Go to `http://localhost:5173/admin`
2. Enter your admin credentials
3. You should see the admin dashboard

### 2. Navigate to Corporate Features
Use the sidebar menu:
- **Medarbejderstyring** → `/admin/corporate/employees`
- **Budget Management** → `/admin/corporate/budget`
- **Settlement Rapporter** → `/admin/corporate/settlement`

Or navigate directly:
- `http://localhost:5173/admin/corporate/employees`
- `http://localhost:5173/admin/corporate/budget`
- `http://localhost:5173/admin/corporate/settlement`

---

## Testing Employee Administration

### Test Case 1: View Employees
```
1. Navigate to /admin/corporate/employees
2. Should see:
   - 3 stat cards (Active, Admins, License Verified)
   - Search bar and filters
   - Table with employee list
3. Click filter dropdown to see departments
4. Type in search box to filter by name/email
```

### Test Case 2: Create New Employee
```
1. Click "Ny Medarbejder" button
2. Fill form:
   - Fuldt Navn: "John Doe"
   - Email: "john@company.com"
   - Telefon: "+45 12 34 56 78"
   - Medarbejder Nummer: "EMP-001"
   - Afdeling: Select one
3. Click "Gem"
4. Should see success toast
5. Employee appears in table
```

### Test Case 3: Edit Employee
```
1. Click edit icon (pencil) on any row
2. Form opens with employee data
3. Change any field
4. Click "Gem"
5. Changes persist in table
```

### Test Case 4: Toggle Admin Rights
```
1. Click shield icon on employee row
2. Should see success/change toast
3. Admin badge should toggle in table
```

### Test Case 5: Deactivate Employee
```
1. Click trash icon on employee row
2. Confirmation dialog appears
3. Click "Deaktiver"
4. Should see success toast
5. Employee status changes to "Inaktiv"
```

### Test Case 6: Search & Filter
```
1. Type name in search box → results filter in real-time
2. Select department filter → table updates
3. Toggle status filter → shows active/inactive only
4. Combine multiple filters
```

---

## Testing Budget Management Dashboard

### Test Case 1: View Dashboard
```
1. Navigate to /admin/corporate/budget
2. Should see:
   - 4 stat cards with summary data
   - Any critical/warning alerts
   - 6-month trend chart
   - Department spend pie chart
   - Department detail table
```

### Test Case 2: Check Calculations
```
Expected behavior:
- Total Budget = Sum of all dept budgets
- Current Spend = Sum of all invoices this month
- Budget % = (Spend / Budget) × 100
- Remaining = Budget - Spend

Verify in UI that math is correct
```

### Test Case 3: Verify Alerts
```
If a department exceeds budget:
- Should see red "Critical" alert at top
- Department row should show >100%

If department at 80-99%:
- Should see yellow "Warning" alert
- Progress bar shows high utilization
```

### Test Case 4: View Charts
```
Line Chart (6-month trend):
- Should show budget and spend lines
- Both should track together

Pie Chart (Department spend):
- Should show department breakdown
- Colors should be distinct per department
```

### Test Case 5: Department Details
```
For each department row:
- Name displays correctly
- Budget amounts match database
- Progress bar fills to % spent
- Invoice count is accurate
- Average invoice calculation correct
```

### Test Case 6: Refresh Data
```
1. Click "Opdater" button
2. Should show loading state
3. Data reloads
4. Changes from Supabase appear
```

---

## Testing Settlement Reports

### Test Case 1: View Dashboard
```
1. Navigate to /admin/corporate/settlement
2. Should see:
   - 5 stat cards with metrics
   - Filters (Status, Month)
   - Report table with:
     * Company name
     * Period (Month Year)
     * Amount
     * Line item count
     * Status badge
     * Due date
```

### Test Case 2: Filter by Status
```
1. Select status filter: "Afventer Betaling"
2. Table updates to show only pending reports
3. Try other statuses
4. Reset to "Alle Statusser"
```

### Test Case 3: View Report Details
```
1. Click eye icon on any report
2. Modal opens showing:
   - Department name
   - Cost center
   - Booking count
   - Total KM
   - Line items table with:
     * Description
     * Quantity
     * Unit price
     * Total
   - Grand total
```

### Test Case 4: Check Calculations
```
In detail modal:
- Sum of line items = Grand total
- Each line item: quantity × unit_price = total
- All amounts format as currency (DKK)
```

### Test Case 5: Status Badges
```
Different status indicators:
- Draft (gray) = Not yet sent
- Pending (yellow) = Awaiting payment
- Sent (blue) = Confirmed sent
- Paid (green) = Payment received
```

### Test Case 6: Download PDF (Future)
```
1. Click download icon
2. Currently shows placeholder message
3. Ready for PDF implementation
```

---

## Chrome DevTools Testing

### Console Errors
```
Press F12 to open DevTools
Go to Console tab
Should see NO red error messages
```

### Network Tab
```
1. Go to Network tab
2. Navigate between features
3. Should see:
   - XHR requests for Supabase queries
   - No 404 errors
   - Reasonable response times (<500ms)
```

### Performance Tab
```
1. Go to Performance tab
2. Click record
3. Interact with features
4. Click stop
5. Check for:
   - Smooth 60fps rendering
   - No long tasks >50ms
   - Quick component rendering
```

### Lighthouse Audit
```
1. Go to Lighthouse tab
2. Click "Analyze page load"
3. Check:
   - Performance score
   - Accessibility
   - Best practices
```

---

## Supabase Verification

### Check Corporate Tables
```bash
# Open Supabase dashboard
# Go to SQL Editor
# Run these queries:

SELECT COUNT(*) FROM corporate_employees;
SELECT COUNT(*) FROM corporate_departments;
SELECT COUNT(*) FROM corporate_invoices;
SELECT COUNT(*) FROM corporate_accounts;
```

### Verify Data
```
1. Corporate Employees should exist
2. Corporate Departments should exist
3. Corporate Invoices should exist (for budget testing)
4. Corporate Accounts should be linked
```

---

## Common Issues & Troubleshooting

### Issue: "Loading..." stuck infinitely
**Solution**: 
- Check browser console for errors (F12)
- Verify Supabase connection in Network tab
- Check `.env` for correct SUPABASE_URL and KEY

### Issue: "No employees" even after adding
**Solution**:
- Refresh page (Cmd/Ctrl + R)
- Check Supabase directly for new records
- Verify RLS policies allow SELECT

### Issue: Budget shows 0% despite invoices
**Solution**:
- Verify invoices have invoice_date in current month
- Check corporate_invoices table has data
- Verify department_breakdown field has values

### Issue: Can't edit employee
**Solution**:
- Check admin auth is working
- Verify RLS allows UPDATE
- Check browser console for error details

### Issue: Charts not rendering
**Solution**:
- Scroll down (charts might be off-screen)
- Check browser console for errors
- Verify data is loading (no loading spinner)
- Try refreshing page

---

## Performance Benchmarks

### Expected Load Times
- Employee list: < 500ms
- Budget dashboard: < 1s (includes chart render)
- Settlement reports: < 800ms
- Individual detail modal: < 300ms

### Test with DevTools:
```
1. Open Network tab
2. Hard refresh (Cmd/Ctrl + Shift + R)
3. Watch XHR requests
4. Note total load time
5. Compare to benchmarks above
```

---

## Reporting Issues

When reporting issues, include:
1. **URL**: Which page (`/admin/corporate/employees`, etc)
2. **Action**: What you were doing
3. **Error**: What happened (screenshot if visual)
4. **Console**: Any error messages (F12 → Console)
5. **Browser**: Which browser/version
6. **Frequency**: Always, sometimes, once?

---

## Build & Production Testing

### Local Build Test
```bash
# Build for production
npm run build

# Should complete in ~60 seconds
# Look for: "✓ built in XXs"
# No errors should appear
```

### Verify Bundle
```bash
# Check new files created
ls -la dist/

# Should include:
# - index.html
# - assets/ (JS/CSS bundles)
# - sw.js (service worker)
```

### Test Production Build
```bash
# Serve production build locally
npm run preview

# Navigate to http://localhost:4173/
# Test same scenarios as dev server
```

---

## Next Testing Phases

### Staging Environment
- [ ] Deploy to staging URL
- [ ] Test with real Supabase data
- [ ] Load testing with realistic data
- [ ] Mobile device testing
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)

### Production Rollout
- [ ] Feature flag setup
- [ ] Gradual rollout (10% → 50% → 100%)
- [ ] Monitor error tracking (Sentry)
- [ ] Track usage metrics
- [ ] Collect user feedback

---

## Quick Reference

| Feature | Route | Test Time |
|---------|-------|-----------|
| Employee Admin | `/admin/corporate/employees` | 5-10 min |
| Budget Dashboard | `/admin/corporate/budget` | 3-5 min |
| Settlement Reports | `/admin/corporate/settlement` | 3-5 min |
| All Three | All above | 15-20 min |

---

## Support Contact

For questions or issues:
1. Check this guide first
2. Review `CORPORATE_FEATURES_GUIDE.md` for detailed docs
3. Check `CORPORATE_IMPLEMENTATION_PROGRESS.md` for status
4. Review commit `ca02a26` for exact changes

---

*Last Updated: Today*
*Version: 1.0*
*Status: Ready for Testing*
