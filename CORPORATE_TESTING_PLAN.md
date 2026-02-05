# Corporate Features - Praktisk Validering

## Test-Plan for de 3 Komponenter

### 🎯 Adgang
```
Admin Dashboard > Corporate
├── /admin/corporate/employees   → Employee Admin (CRUD)
├── /admin/corporate/budget      → Budget Dashboard (Analytics)
└── /admin/corporate/settlement  → Settlement Reports (Reporting)
```

### 1️⃣ Employee Admin (`/admin/corporate/employees`)

**Hvad tester vi:**
- ✅ Komponent loader uden fejl
- ✅ useCorporateFleet() hook henter data
- ✅ Kan tilføje ny medarbejder
- ✅ Kan redigere medarbejder
- ✅ Kan deaktivere medarbejder
- ✅ Admin rights toggle virker
- ✅ Departement-filter fungerer

**Data flow:**
```
1. Component mount → refetch() kaldet
2. Supabase query: corporate_employees + departments
3. Form submit → Insert/Update i DB
4. Toast notification vises
5. List auto-refresh
```

**Test steps:**
1. Åbn `/admin/corporate/employees`
2. Tjek at listen loader (30s timeout)
3. Klik "Tilføj medarbejder" og fyld form
4. Verify: Nye medarbejder vises i listen
5. Klik edit på medarbejder → verify form populated
6. Toggle admin → verify status ændres
7. Deaktiver medarbejder → verify visuelle change

---

### 2️⃣ Budget Dashboard (`/admin/corporate/budget`)

**Hvad tester vi:**
- ✅ Komponent loader uden fejl
- ✅ Monthly trend chart tegner data
- ✅ Department budget cards viser procenter
- ✅ Invoice data aggregeres korrekt
- ✅ Department breakdown beregning virker
- ✅ Alerts genereres ved overskridelse (80%)

**Data flow:**
```
1. Component mount → refetch() kaldet
2. Hent departments + invoices
3. Map invoices → department_breakdown loop
4. Aggreger: spent, bookings, trend
5. Calculate: percentage, average_invoice
6. Render cards + chart
```

**Test steps:**
1. Åbn `/admin/corporate/budget`
2. Tjek at departement cards viser:
   - `[Deptname] • DKK X.XXX`
   - Progress bar (%)
   - Budget status (OK/Warning/Critical)
3. Tjek monthly trend chart
4. Klik på departement → detaljer vises
5. Verify totals er korrekte
6. Tjek at alerts vises for budget> 80%

---

### 3️⃣ Settlement Reports (`/admin/corporate/settlement`)

**Hvad tester vi:**
- ✅ Komponent loader uden fejl
- ✅ Invoices grupperes efter måned + virksomhed
- ✅ Report cards viser correcte totals
- ✅ Status filter virker (sent/pending/paid)
- ✅ Month filter virker
- ✅ PDF export er tilgængelig
- ✅ Line items tæller korrekt

**Data flow:**
```
1. Component mount → refetch() kaldet
2. Hent invoices fra Supabase
3. Group by: corporate_account_id + month
4. For hver: aggregate total_amount, line_items
5. Generate reportMap
6. Sort by date descending
7. Render cards + filters
```

**Test steps:**
1. Åbn `/admin/corporate/settlement`
2. Tjek at report cards vises med:
   - Virksomhedsnavn
   - Måned + år
   - Total beløb
   - # line items
   - Status badge
3. Filter by status → verify kort filtreres
4. Filter by month → verify kort filtreres
5. Klik on rapport → detail view
6. Tjek PDF export button
7. Verify totals matcher invoices

---

## 🔧 Debug Checklist

Hvis der er problemer:

```
☐ Check browser console for JS errors
☐ Check Network tab for failed API calls
☐ Verify Supabase connection in DevTools
☐ Check Sentry dashboard for errors
☐ Run: npm run build → any type errors?
☐ Check useCorporateFleet hook loading state
☐ Verify user has corporate_account access
```

## 📊 Success Criteria

✅ **All 3 components load without errors**
✅ **Data flows correctly from Supabase**
✅ **CRUD operations work (create, read, update)**
✅ **Calculations are accurate**
✅ **UI responds to data changes**
✅ **Filters and sorting work**
✅ **No console errors or warnings**

## 🚀 Next Steps After Validation

- [ ] Add error boundary for each component
- [ ] Add loading skeletons
- [ ] Add empty state UI
- [ ] Performance optimization (if needed)
- [ ] User acceptance testing
- [ ] Deploy to staging

---

**Started:** January 27, 2026  
**Status:** Ready for practical testing
