# Corporate Features - Visual Testing Checklist

## Before You Start
```bash
npm run dev
# Open http://localhost:5173
# Login as admin
# Navigate to Admin Dashboard > Corporate
```

---

## 1. EMPLOYEE ADMIN (`/admin/corporate/employees`)

### Layout Check
- [ ] Header: "Medarbejder Administration"
- [ ] Sidebar: shows departments list
- [ ] Table: columns (Navn, Email, Telefon, Afdeling, Status, Handlinger)
- [ ] Add button: "Tilføj medarbejder"

### Data Loading
- [ ] Table loads within 3 seconds
- [ ] If no employees: "Ingen medarbejdere endnu" message
- [ ] Department filter populates with real departments

### CRUD Operations

#### Create (Tilføj medarbejder)
- [ ] Click "Tilføj medarbejder" → Dialog opens
- [ ] Form shows: Navn, Email, Telefon, Medarbejder #, Afdeling, Admin
- [ ] Fill form + click "Gem"
- [ ] Success toast: "Medarbejder tilføjet"
- [ ] New employee appears in table instantly
- [ ] Data persists after page refresh

#### Read/Filter
- [ ] Filter by department → only those employees show
- [ ] Search by name → case-insensitive filter
- [ ] List sorted by name (A-Z)

#### Update (Rediger)
- [ ] Click edit icon → Dialog with pre-filled data
- [ ] Modify field (e.g., telefon)
- [ ] Click "Gem" → Success toast
- [ ] Table updates without reload

#### Delete (Deaktivér)
- [ ] Click delete icon → Confirmation dialog
- [ ] Click "Ja, slet" → Success toast
- [ ] Employee moves to "Inaktiv" or disappears
- [ ] Can re-activate if supported

#### Admin Rights
- [ ] Click "Admin" toggle → Badge changes
- [ ] Confirm alert: "Admin-rettigheder tildelt"
- [ ] State persists

### Edge Cases
- [ ] Empty email → validation error
- [ ] Duplicate email → error handling
- [ ] Network error → graceful message
- [ ] Long names → truncate or wrap properly

---

## 2. BUDGET DASHBOARD (`/admin/corporate/budget`)

### Layout Check
- [ ] Header: "Budget Dashboard"
- [ ] Filter: Department dropdown + Month picker
- [ ] Cards layout: Shows all departments
- [ ] Chart: Monthly trend graph

### Department Cards
For each card, verify:
- [ ] Department name
- [ ] Budget amount (DKK X.XXX)
- [ ] Spent amount (DKK Y.YYY)
- [ ] Progress bar (0-100%)
- [ ] Percentage label
- [ ] Status badge:
  - Green: < 50%
  - Yellow: 50-80%
  - Red: > 80%

### Calculations
- [ ] Total budget = sum of all departments
- [ ] Total spent = invoices aggregated
- [ ] Percentage = (spent / budget) * 100
- [ ] Trend = month-over-month change

### Interactions
- [ ] Click department card → shows details
- [ ] Filter by month → chart updates
- [ ] Numbers are consistent with Settlement Reports

### Chart Visualization
- [ ] X-axis: Months (Jan-Dec or last 12 months)
- [ ] Y-axis: Amount in DKK
- [ ] Line/bars visible and readable
- [ ] Legend shows all departments
- [ ] Tooltip on hover

### Edge Cases
- [ ] No invoices yet → show 0% for all
- [ ] Budget = 0 → avoid division by zero
- [ ] Future months → show 0 or gray out
- [ ] Only 1 month data → chart still renders

---

## 3. SETTLEMENT REPORTS (`/admin/corporate/settlement`)

### Layout Check
- [ ] Header: "Settlement Reports"
- [ ] Filters: Status dropdown + Month picker
- [ ] Report cards: grouped by month + company
- [ ] Stats dashboard: Total revenue, pending, overdue

### Report Cards
For each card, verify:
- [ ] Company name
- [ ] Month label (e.g., "Januar 2026")
- [ ] Total amount (DKK)
- [ ] # of line items
- [ ] Status badge (Sendt, Betalt, Forfalden)
- [ ] Action buttons (View Details, Export PDF)

### Data Grouping
- [ ] Cards grouped by month (newest first)
- [ ] Within month: grouped by company
- [ ] Totals are correctly summed

### Filters
- [ ] Filter by status → only matching reports show
- [ ] Filter by month → only that month shows
- [ ] Both filters work together
- [ ] "Alle" option resets filters

### Interactions
- [ ] Click card → details modal opens
- [ ] Details show:
  - Invoice list for that period
  - Line item breakdown
  - Department distribution
- [ ] Export PDF button → downloads file
- [ ] Close details → returns to list

### Stats Dashboard (Top)
- [ ] Total Revenue: sum of all
- [ ] Pending Payment: status='draft'
- [ ] Overdue: status='overdue'
- [ ] Average Days to Payment: calculated

### Edge Cases
- [ ] No reports → "Ingen rapporter" message
- [ ] Empty month → skip or show as 0
- [ ] PDF export fails → error toast
- [ ] Very large numbers → formatting (1M+, etc.)

---

## Performance Checks

- [ ] Page loads in < 2 seconds
- [ ] No jank when scrolling list
- [ ] Chart renders smoothly
- [ ] Filter responds instantly
- [ ] No memory leaks (open DevTools Memory tab, take snapshots)

---

## Console & Network Checks

### Browser Console
- [ ] No red errors ❌
- [ ] No yellow warnings ⚠️ (except expected)
- [ ] No failed API calls in Network tab

### Network Tab
- [ ] Corporate_employees: 200 OK
- [ ] Corporate_departments: 200 OK
- [ ] Corporate_invoices: 200 OK
- [ ] API times reasonable (< 1s each)

### Sentry (if integrated)
- [ ] No new errors in Sentry dashboard
- [ ] All errors have context

---

## User Permission Checks

- [ ] Admin sees all data (invoices, stats)
- [ ] Non-admin employee sees only own bookings
- [ ] Non-corporate user → redirect/error gracefully

---

## Responsive Design

- [ ] Desktop (1920px): Full layout
- [ ] Laptop (1366px): Cards stack nicely
- [ ] Tablet (768px): Cards full-width, readable
- [ ] Mobile (375px): Scrollable, no overflow

---

## Final Checklist

✅ All 3 pages load without errors
✅ CRUD operations work (create, read, update, delete)
✅ Data is consistent across pages
✅ Calculations are accurate
✅ UI is responsive
✅ Performance is acceptable
✅ No console errors
✅ Error handling graceful

---

## Known Limitations (Document if found)

- [ ] PDF export not yet implemented
- [ ] Real-time sync not enabled
- [ ] Bulk operations not available
- [ ] Export to CSV not available

---

## Bugs Found (Log here)

| Component | Issue | Severity | Status |
|-----------|-------|----------|--------|
|           |       |          |        |

---

**Date Tested:** _______________
**Tested By:** _______________
**Status:** 🟢 PASS / 🟡 NEEDS FIX / 🔴 BLOCKED
