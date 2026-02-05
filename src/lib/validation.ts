import { z } from 'zod';

// Zod schemas for type-safe data validation

// Invoice schemas
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  booking_id: z.string().uuid().nullable(),
  lessor_id: z.string().uuid(),
  renter_id: z.string().uuid(),
  invoice_number: z.string().min(3),
  status: z.enum(['draft', 'sent', 'viewed', 'partially_paid', 'paid', 'overdue', 'cancelled']),
  amount_total: z.number().positive(),
  amount_paid: z.number().min(0),
  amount_due: z.number().min(0),
  issue_date: z.string().datetime(),
  due_date: z.string().datetime(),
  sent_at: z.string().datetime().nullable(),
  viewed_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateInvoiceSchema = z.object({
  booking_id: z.string().uuid().optional(),
  lessor_id: z.string().uuid(),
  renter_id: z.string().uuid(),
  amount_total: z.number().positive(),
  due_date: z.string().datetime(),
});

// Subscription schemas
export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  renter_id: z.string().uuid(),
  lessor_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  subscription_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  daily_rate: z.number().positive(),
  billing_cycle_days: z.number().positive(),
  billing_amount: z.number().positive(),
  status: z.enum(['active', 'paused', 'cancelled', 'expired']),
  total_billing_cycles: z.number().int().positive().optional(),
  completed_billing_cycles: z.number().int().min(0),
  start_date: z.string().datetime(),
  end_date: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const CreateSubscriptionSchema = z.object({
  renter_id: z.string().uuid(),
  lessor_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  subscription_type: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
  daily_rate: z.number().positive(),
  total_billing_cycles: z.number().int().positive().optional(),
  start_date: z.string().datetime(),
});

// Payment reminder schemas
export const PaymentReminderSchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid(),
  reminder_type: z.enum(['due_date', 'overdue_1', 'overdue_2', 'overdue_3', 'final_notice']),
  scheduled_date: z.string().datetime(),
  sent_at: z.string().datetime().nullable(),
  status: z.enum(['pending', 'sent', 'failed', 'cancelled']),
  email_subject: z.string().min(5),
  email_body: z.string().min(10),
  recipient_email: z.string().email(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Accounting schemas
export const AccountingEntrySchema = z.object({
  id: z.string().uuid(),
  invoice_id: z.string().uuid().nullable(),
  subscription_id: z.string().uuid().nullable(),
  lessor_id: z.string().uuid(),
  entry_type: z.enum(['revenue', 'expense', 'receivable', 'payable']),
  account_code: z.string().regex(/^\d{4}$/),
  debit_amount: z.number().min(0),
  credit_amount: z.number().min(0),
  accounting_period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  posting_date: z.string().datetime(),
  status: z.enum(['draft', 'posted', 'reconciled', 'cancelled']),
  external_id: z.string().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Validation helpers
export const validateInvoice = (data: unknown) => {
  return InvoiceSchema.safeParse(data);
};

export const validateCreateInvoice = (data: unknown) => {
  return CreateInvoiceSchema.safeParse(data);
};

export const validateSubscription = (data: unknown) => {
  return SubscriptionSchema.safeParse(data);
};

export const validateCreateSubscription = (data: unknown) => {
  return CreateSubscriptionSchema.safeParse(data);
};

export const validatePaymentReminder = (data: unknown) => {
  return PaymentReminderSchema.safeParse(data);
};

export const validateAccountingEntry = (data: unknown) => {
  return AccountingEntrySchema.safeParse(data);
};

// Batch validation helper
export const validateBatch = <T extends z.ZodSchema>(
  schema: T,
  items: unknown[]
): { valid: z.infer<T>[]; invalid: { item: unknown; error: string }[] } => {
  const valid: z.infer<T>[] = [];
  const invalid: { item: unknown; error: string }[] = [];

  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) {
      valid.push(result.data);
    } else {
      invalid.push({
        item,
        error: result.error.message,
      });
    }
  }

  return { valid, invalid };
};
