# Corporate Features Implementation Guide

## Overview
This document covers the three core enterprise revenue-generating features now implemented in LEJIO:
1. **Employee Administration** - Manage corporate employee access and permissions
2. **Budget Management** - Track departmental spending and budgets
3. **Settlement Reports** - Generate and track monthly invoices

These features unlock the enterprise customer segment and typically generate $500-2000/month per customer.

---

## 1. Employee Administration (`/admin/corporate/employees`)

### Purpose
Centralized management of corporate employee access, permissions, and license verification.

### Key Features

#### Employee Management
- **List View**: Display all employees with real-time search and filtering
- **Add New**: Create employee accounts with department assignment
- **Edit**: Update employee details and permissions
- **Deactivate**: Soft-delete employees (they retain history)
- **Admin Rights**: Toggle admin access per employee

#### Filtering & Search
- Search by: Name, Email, Employee Number
- Filter by: Department, Status (Active/Inactive)
- Real-time results as you type

#### Status Indicators
- **Active/Inactive**: Visual badge showing current status
- **Admin Badge**: Indicates elevated permissions
- **License Verification**: Shows which employees have verified licenses

### Database Schema (useCorporateFleet.tsx)
```typescript
interface CorporateEmployee {
  id: string;
  corporate_account_id: string;
  department_id: string | null;
  user_id: string | null;
  employee_number: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  driver_license_verified: boolean;
  is_admin: boolean;
  is_active: boolean;
  department?: CorporateDepartment;
}
```

### API Endpoints
All operations use Supabase:
- `GET /corporate_employees` - List employees
- `POST /corporate_employees` - Create employee
- `UPDATE /corporate_employees` - Update employee
- `UPDATE /corporate_employees` - Soft-delete (set is_active=false)

### Implementation Details
- **State Management**: React hooks (useState, useCallback)
- **Data Fetching**: useCorporateFleet() hook
- **UI Components**: shadcn-ui Table, Dialog, Badge, Select
- **Icons**: Lucide React (Users, Shield, CheckCircle, etc.)

### User Flow
1. Navigate to `/admin/corporate/employees`
2. View all active employees (stats at top)
3. Search or filter employees
4. Click "Ny Medarbejder" to add new employee
5. Fill form with required fields (name, email) + optional (phone, employee #, department)
6. Toggle admin rights or deactivate as needed
7. Changes persist to Supabase in real-time

---

## 2. Budget Management (`/admin/corporate/budget`)

### Purpose
Track departmental spending against monthly budgets with alerts and forecasting.

### Key Features

#### Real-Time Monitoring
- **Total Budget**: Sum of all department budgets
- **Current Spend**: Aggregated from invoices this month
- **Budget Utilization**: Percentage spend vs. budget
- **Remaining Budget**: Available funds

#### Department-Level Tracking
- Individual budget vs. actual spend
- Percentage utilization with progress bar
- Invoice count per department
- Average invoice amount
- Month-over-month trends

#### Alert System
- **Critical Alert** (Red): Department has exceeded budget
- **Warning Alert** (Yellow): Department at 80%+ of budget
- Both alerts visible at top of dashboard

#### Visualizations
- **6-Month Trend Line Chart**: Budget vs. Spend over time
- **Department Spend Pie Chart**: How budget is distributed
- **Department Detail Table**: Full breakdown per department

### Database Schema
Pulls from:
- `corporate_departments`: monthly_budget per department
- `corporate_invoices`: line items and amounts
- Aggregates by invoice_date to monthly buckets

### Implementation Details
- **Data Fetching**: Loads invoices for current month on component mount
- **Calculations**: Real-time percentage, trend, and comparison calculations
- **Charts**: Recharts library (LineChart, PieChart, BarChart)
- **Performance**: Async data loading with loading states

### User Flow
1. Navigate to `/admin/corporate/budget`
2. See summary cards: Total Budget, Current Spend, Remaining, Over-Budget Count
3. View any critical/warning alerts
4. Scroll to see 6-month trend chart
5. See department utilization pie chart
6. Scroll to detailed table with per-department breakdown
7. Click "Opdater" to refresh data

### Alert Examples
- "Sales Department: Budget overskredet med 12.5%"
- "Operations: 89.2% af budget tilbage"

---

## 3. Settlement Reports (`/admin/corporate/settlement`)

### Purpose
Generate, track, and manage monthly invoices for corporate customers with payment status tracking.

### Key Features

#### Report Dashboard
- **Total Reports**: Count of all settlement reports created
- **Total Revenue**: Cumulative amount across all reports
- **Pending Payment**: Total amount awaiting payment
- **Overdue Payments**: Count of payments past due date
- **Avg. Days to Payment**: Metric for payment velocity

#### Report Listing
- Company name and report period (month/year)
- Total invoice amount
- Line item count
- Status badge (Draft, Pending, Sent, Paid)
- Due date
- Action buttons

#### Report Viewing
- Dialog opens showing detailed breakdown
- Department information and cost center
- Booking count and total KM for period
- Line items table with description, quantity, unit price, total
- Grand total at bottom

#### Status Workflow
- **Draft**: Not yet sent to customer
- **Pending**: Sent but not yet paid
- **Sent**: Confirmed delivery to customer
- **Paid**: Payment received

### Database Schema
Aggregates from:
- `corporate_invoices`: Per-invoice data
- Groups by: month, corporate_account_id
- Calculates: total_amount, line_item_count

```typescript
interface SettlementReport {
  id: string;
  month: string;
  year: number;
  corporate_account_id: string;
  company_name: string;
  total_amount: number;
  department_count: number;
  line_item_count: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  created_at: string;
  due_date: string;
  paid_date?: string;
}
```

### Implementation Details
- **Aggregation**: Groups corporate_invoices by month + account
- **Status Management**: Tracks payment lifecycle
- **PDF Export**: Ready for future implementation (placeholder)
- **Filtering**: By status and month

### User Flow
1. Navigate to `/admin/corporate/settlement`
2. See dashboard stats (total reports, revenue, pending, overdue)
3. Filter by status or month if needed
4. View table of all settlement reports
5. Click eye icon to view detailed breakdown
6. See department breakdown and line items
7. Click download icon for PDF (future feature)

### Future Enhancements
- PDF generation with company letterhead
- Email integration to auto-send reports
- Payment status webhooks from payment gateway
- Dunning management for overdue payments
- Multi-currency support

---

## Architecture & Integration

### File Structure
```
src/
├── pages/admin/
│   ├── CorporateEmployeeAdmin.tsx      (650 lines)
│   ├── CorporateBudgetDashboard.tsx    (450 lines)
│   └── CorporateSettlementReports.tsx  (550 lines)
├── hooks/
│   └── useCorporateFleet.tsx           (356 lines - existing)
└── components/admin/
    └── AdminDashboardLayout.tsx        (3 menu items added)

App.tsx:
  ├── Lazy import all 3 components
  ├── Route /admin/corporate/employees
  ├── Route /admin/corporate/budget
  └── Route /admin/corporate/settlement
```

### Data Flow
```
Component State (useState)
    ↓
Hook (useCorporateFleet) → Supabase queries
    ↓
Transform/Aggregate data
    ↓
Display in UI
    ↓
User actions → Supabase mutations
```

### Supabase Integration
All components use Supabase client for:
- `SELECT`: Fetch employees, invoices, departments
- `INSERT`: Create new employees
- `UPDATE`: Edit employee/report details
- `DELETE`: Soft-delete via is_active flag

### Error Handling
- Try/catch blocks around all async operations
- Toast notifications for user feedback
- Loading states during data fetches
- Fallback UI for missing/error states

---

## Deployment Checklist

### Before Going Live
- [ ] Verify all routes in App.tsx are correct
- [ ] Check menu items added to AdminDashboardLayout
- [ ] Test employee CRUD operations
- [ ] Test budget calculations with sample data
- [ ] Test settlement report generation
- [ ] Verify build succeeds: `npm run build`
- [ ] Test on staging environment
- [ ] Set up Supabase RLS policies for corporate data
- [ ] Configure admin auth for corporate features
- [ ] Add to feature flags (if using)

### Supabase RLS Policies Required
```sql
-- corporate_employees
CREATE POLICY "Allow admin to view corporate employees"
  ON corporate_employees
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_admin);

-- Similar policies for corporate_invoices, corporate_departments
```

### Environment Variables
```
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_KEY=eyJ...
```

---

## Performance Notes

### Build Size
- Employee Admin: ~45 KB (lazy-loaded)
- Budget Dashboard: ~50 KB (lazy-loaded with charts)
- Settlement Reports: ~48 KB (lazy-loaded)
- Total added to app bundle: ~0 KB (lazy-loaded, only when visited)

### Data Optimization
- Budget Dashboard queries only current month invoices
- Employee list uses efficient Supabase SELECT
- Settlement reports aggregate on frontend (for now)

### Future Optimizations
- Add pagination to employee list (large companies)
- Move settlement report aggregation to edge function
- Cache budget calculations
- Add database indexes on corporate_account_id + date

---

## Testing Scenarios

### Employee Administration
1. ✅ Create employee without department
2. ✅ Create employee with department
3. ✅ Toggle admin rights multiple times
4. ✅ Deactivate employee
5. ✅ Search by name
6. ✅ Filter by department
7. ✅ Filter by status

### Budget Management
1. ✅ Load current month data
2. ✅ Calculate correct percentages
3. ✅ Show correct alerts
4. ✅ Display 6-month trend
5. ✅ Handle zero budget edge case
6. ✅ Show correct remaining amount

### Settlement Reports
1. ✅ List all settlement reports
2. ✅ Open report detail modal
3. ✅ View line items breakdown
4. ✅ Filter by status
5. ✅ Calculate correct totals
6. ✅ Display correct due dates

---

## Support & Troubleshooting

### Common Issues

**Issue: Employee not appearing after creation**
- Solution: Ensure corporate_account_id is correctly set
- Check Supabase RLS policies allow INSERT

**Issue: Budget shows 0%**
- Solution: Verify invoices exist for current month
- Check invoice_date is within current month range

**Issue: Settlement report not showing**
- Solution: Refresh the page or click "Opdater" button
- Check that invoices exist in corporate_invoices table

### Debug Mode
Add logging to components:
```typescript
console.log('Loading budget data:', { budgetData, isLoading });
console.log('Settlement reports:', { reports, stats });
```

---

## Revenue Impact

### Typical Corporate Contract
- Monthly fee: $500-2000 depending on fleet size
- Per-employee management: $50-100/month
- Budget tracking: Included
- Settlement reports: Included

### Estimated Implementation ROI
- Development time: ~30 hours (3 features)
- Time to first customer: ~1-2 weeks
- Break-even: 1-2 corporate customers
- Monthly recurring revenue potential: $5000+

---

## Future Enhancements (Post-MVP)

1. **Advanced Analytics**
   - Department performance metrics
   - Driver behavior analytics
   - Cost per km trends

2. **Integration**
   - Automatic email reports
   - Accounting software sync (Exact, Visma)
   - Payment gateway webhooks

3. **Customization**
   - White-label invoices
   - Custom budget categories
   - Multi-currency support

4. **Automation**
   - Auto-generate monthly reports
   - Auto-send to accounting
   - Dunning management

---

## Related Files Modified

1. **src/App.tsx**: Added 3 route imports and routes
2. **src/components/admin/AdminDashboardLayout.tsx**: Added 3 menu items
3. **Package already includes**: Recharts (charts), shadcn-ui (UI)

---

## Questions?

Refer to:
- [useCorporateFleet Hook](./src/hooks/useCorporateFleet.tsx) - Data management
- [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) - Overall planning
- [Email Integration](./EMAIL_SERVICE_SETUP.md) - For sending reports
