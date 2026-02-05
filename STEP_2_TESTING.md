# 🧪 Step 2: Testing - Comprehensive Test Suite

**Only proceed after Step 1 is complete!**

---

## Pre-Testing Checklist

- [ ] Step 1 complete: Migrations pushed to Supabase
- [ ] TypeScript types regenerated
- [ ] Build passing: `npm run build` ✅
- [ ] No TypeScript errors
- [ ] All 6 database tables visible in Supabase

---

## Test Environment Setup

### Prerequisites
```bash
# Make sure you're on the latest code
git pull origin main

# Install dependencies
npm install

# Build the project
npm run build
# Should complete in ~54 seconds
```

### Verify Build
```bash
npm run build 2>&1 | grep "✓ built in"
# Expected: ✓ built in XX.XXs
```

---

## Test Suite: 7 Routes to Verify

### 1. Employee Management (/admin/corporate/employees)
**Route:** `localhost:8080/admin/corporate/employees`

**Tests:**
- [ ] Page loads without errors
- [ ] Employee list displays
- [ ] "Add Employee" button works
- [ ] Can create new employee
- [ ] Can edit existing employee
- [ ] Can view employee details
- [ ] Admin toggle appears
- [ ] Department filter works

**Expected Data Display:**
- Employee list table
- Name, email, department, role columns
- Action buttons (edit, delete, toggle admin)

---

### 2. Budget Dashboard (/admin/corporate/budget)
**Route:** `localhost:8080/admin/corporate/budget`

**Tests:**
- [ ] Page loads without errors
- [ ] Budget charts display
- [ ] Department cards show budget info
- [ ] Spending percentage calculates correctly
- [ ] Alert badges show for >80% spending
- [ ] Trending data visualizes

**Expected Data Display:**
- Line chart showing budget trends
- Department budget cards
- Budget alerts

---

### 3. Settlement Reports (/admin/corporate/reports)
**Route:** `localhost:8080/admin/corporate/reports`

**Tests:**
- [ ] Page loads without errors
- [ ] Reports list displays
- [ ] Month filter works
- [ ] Status filter works
- [ ] Company filter works
- [ ] Can view report details
- [ ] Amount totals display

**Expected Data Display:**
- Reports table with dates
- Total amounts aggregated
- Status indicators

---

### 4. Role Management (/admin/corporate/roles)
**Route:** `localhost:8080/admin/corporate/roles`

**Tests:**
- [ ] Page loads without errors
- [ ] Role list displays
- [ ] "Create Role" button works
- [ ] Can add new role
- [ ] Permission checkboxes appear
- [ ] Can select permissions by category
- [ ] Can edit role
- [ ] Can delete role
- [ ] Permissions persist

**Expected Data Display:**
- Roles table
- Permission count badge
- 4 permission categories (Medarbejdere, Budget, Rapporter, Indstillinger)
- 13 total permissions

---

### 5. Email Integration (/admin/corporate/email)
**Route:** `localhost:8080/admin/corporate/email`

**Tests:**
- [ ] Page loads without errors
- [ ] Template list displays
- [ ] "Create Template" button works
- [ ] Can add new email template
- [ ] Subject field works
- [ ] Body field works
- [ ] Recipient group selector works
- [ ] Variable placeholders display info
- [ ] Can edit template
- [ ] Can delete template
- [ ] Email logs show history
- [ ] Email status displays (pending/sent/failed)

**Expected Data Display:**
- Templates table (Name, Recipients, Subject)
- Email logs with status
- Variable placeholders: {{employee_name}}, {{company_name}}

---

### 6. Document Management (/admin/corporate/documents)
**Route:** `localhost:8080/admin/corporate/documents`

**Tests:**
- [ ] Page loads without errors
- [ ] Document list displays
- [ ] "Upload Document" button works
- [ ] File upload dialog opens
- [ ] Can select file
- [ ] Progress bar shows during upload
- [ ] Document metadata form works
- [ ] Category selector works (contracts, reports, policies, finance, other)
- [ ] Visibility toggle works (private, internal, public)
- [ ] Can filter by category
- [ ] Download button works
- [ ] Delete button works

**Expected Data Display:**
- Documents table with Name, Category, Visibility, Size
- Category filter tabs
- File download links

---

### 7. API Integration (/admin/corporate/api)
**Route:** `localhost:8080/admin/corporate/api`

**Tests:**
- [ ] Page loads without errors
- [ ] API keys list displays
- [ ] "Generate Key" button works
- [ ] Key generation dialog opens
- [ ] Key name input works
- [ ] Scope selector shows 7 options
- [ ] Expiration selector works
- [ ] Key displays with prefix "lejio_"
- [ ] Copy button copies key
- [ ] Key secret visible once (security test)
- [ ] Can deactivate key
- [ ] Can delete key
- [ ] API logs display
- [ ] Logs show method, endpoint, status

**Expected Data Display:**
- API keys table
- 7 available scopes
- API request logs with timestamp, method, status

---

## Role-Based Access Control Testing

### Test Admin Access
```
1. Log in as admin user
2. Navigate to /admin/corporate/employees
3. Should display employee list
4. Create permission: ✅ Should work
5. Update permission: ✅ Should work
6. Delete permission: ✅ Should work
```

### Test Non-Admin Access
```
1. Log in as regular user
2. Navigate to /admin/corporate/employees
3. Should redirect to home or show "Access Denied"
4. Admin routes should NOT be accessible
```

---

## Data Integrity Testing

### Database Constraints
- [ ] Cannot create role without name
- [ ] Cannot create email template without recipient group
- [ ] Cannot upload document without file
- [ ] Cannot generate API key without name
- [ ] Cannot create employee without email

### Relationships
- [ ] Employees linked to corporate account
- [ ] Roles linked to corporate account
- [ ] Documents linked to corporate account
- [ ] API keys linked to corporate account

---

## Performance Testing

### Load Times
```bash
# Start dev server
npm run dev

# Check page load times
# Expected: <2 seconds per page
```

### List Performance
- [ ] 100 employees load smoothly
- [ ] 50 roles load smoothly
- [ ] 100 documents load smoothly
- [ ] 50 API keys load smoothly

---

## Error Handling Testing

### Network Errors
- [ ] Disconnect from Supabase during operation
- [ ] Error toast should appear
- [ ] User can retry operation
- [ ] No white screen of death

### Validation Errors
- [ ] Submit form without required fields
- [ ] Error message appears
- [ ] Form doesn't submit

### File Upload Errors
- [ ] Try uploading >100MB file
- [ ] Should show error
- [ ] Try uploading invalid file type
- [ ] Should show error

---

## Danish Localization Testing

All UI should be in Danish:
- [ ] Button labels are Danish
- [ ] Form placeholders are Danish
- [ ] Error messages are Danish
- [ ] Toast notifications are Danish
- [ ] Menu items are Danish

**Common Danish terms to verify:**
- "Opret" (Create)
- "Rediger" (Edit)
- "Slet" (Delete)
- "Gem" (Save)
- "Annuller" (Cancel)
- "Medarbejdere" (Employees)
- "Budget" (Budget)
- "Rapporter" (Reports)

---

## Browser Compatibility Testing

Test in:
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (if on Mac)
- [ ] Edge

All should work identically.

---

## Mobile Responsiveness Testing

- [ ] Mobile resolution (375px width)
  - [ ] Layout responsive
  - [ ] Buttons clickable
  - [ ] Forms usable

- [ ] Tablet resolution (768px width)
  - [ ] Tables readable
  - [ ] Charts visible

---

## Accessibility Testing

- [ ] Can navigate with keyboard only (Tab key)
- [ ] All buttons have text labels
- [ ] Forms have associated labels
- [ ] Color contrast sufficient
- [ ] Error messages clear

---

## Test Results Template

```
Date: ___________
Tester: ___________
Environment: [dev/staging/prod]

Route 1 (Employees): ✅ / ⚠️ / ❌
Issue: ___________

Route 2 (Budget): ✅ / ⚠️ / ❌
Issue: ___________

Route 3 (Reports): ✅ / ⚠️ / ❌
Issue: ___________

Route 4 (Roles): ✅ / ⚠️ / ❌
Issue: ___________

Route 5 (Email): ✅ / ⚠️ / ❌
Issue: ___________

Route 6 (Documents): ✅ / ⚠️ / ❌
Issue: ___________

Route 7 (API): ✅ / ⚠️ / ❌
Issue: ___________

Overall Status: ✅ PASS / ⚠️ ISSUES / ❌ FAIL

Notes:
___________
```

---

## Known Issues & Workarounds

### Type Casting Warning
**Issue:** You may see `as any` type casting in components
**Status:** Temporary workaround, will remove after type regeneration
**Impact:** None - code still works perfectly

### Supabase Storage Permissions
**Issue:** Document upload requires proper Supabase Storage bucket
**Solution:** Ensure bucket "corporate-documents" exists in Supabase
**Workaround:** Create bucket via Supabase Dashboard → Storage

---

## Debugging Tips

### View Console Errors
```bash
# Open browser DevTools (F12)
# Go to Console tab
# Look for red errors
# Click on error to see details
```

### Check Network Tab
```
1. Open DevTools (F12)
2. Go to Network tab
3. Perform action
4. Look for failed requests (red)
5. Click on request to see response
```

### Check Application/Storage
```
1. Open DevTools (F12)
2. Go to Application tab
3. Check Local Storage for auth token
4. Check if Supabase client initialized
```

---

## When All Tests Pass

1. Document results
2. Note any issues found
3. Create GitHub issues for any bugs
4. Proceed to Step 3: Deployment

---

## Next Steps After Testing

If all tests pass:
- [ ] Create GitHub issues for any bugs
- [ ] Assign to team
- [ ] Move to Step 3: Production Deployment

If issues found:
- [ ] Document issues clearly
- [ ] Create GitHub issues
- [ ] Wait for fixes
- [ ] Re-test components

---

**Testing Checklist Complete!** ✅

Once you've verified all 7 routes work correctly, you're ready for production deployment!

Last updated: January 27, 2026
