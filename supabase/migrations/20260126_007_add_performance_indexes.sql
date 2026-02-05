-- Performance indexes for payment system tables

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_renter_status 
ON invoices(renter_id, status) 
WHERE status IN ('unpaid', 'overdue', 'partially_paid');

CREATE INDEX IF NOT EXISTS idx_invoices_lessor_created 
ON invoices(lessor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_invoices_due_date_status 
ON invoices(due_date, status) 
WHERE status != 'paid' AND status != 'cancelled';

-- Payment reminders indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminders_scheduled 
ON payment_reminders(scheduled_date, status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_payment_reminders_invoice_status 
ON payment_reminders(invoice_id, status DESC);

-- Subscriptions indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_active 
ON subscriptions(renter_id, status, created_at DESC) 
WHERE status IN ('active', 'paused');

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing 
ON subscriptions(created_at, status) 
WHERE status = 'active';

-- Accounting indexes
CREATE INDEX IF NOT EXISTS idx_accounting_entries_period_status 
ON accounting_entries(accounting_period, status) 
WHERE status IN ('draft', 'posted');

CREATE INDEX IF NOT EXISTS idx_accounting_entries_lessor_month 
ON accounting_entries(lessor_id, accounting_period DESC);

-- Cross-table query optimization
CREATE INDEX IF NOT EXISTS idx_invoices_booking_status 
ON invoices(booking_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_vehicle_renter 
ON subscriptions(vehicle_id, renter_id);

-- Audit trail optimization
CREATE INDEX IF NOT EXISTS idx_accounting_entries_external_sync 
ON accounting_entries(external_id, status) 
WHERE external_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_reminders_sent_at 
ON payment_reminders(sent_at DESC) 
WHERE sent_at IS NOT NULL;
