// DEPRECATED - Use Azure client instead (src/integrations/azure/client.ts)
// This file is kept for reference only
throw new Error('Use @/integrations/azure/client instead of Supabase client');

// Type-safe query helpers
export const safeQuerySingle = async <T>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> => {
  const { data, error } = await query;
  return {
    data: data?.[0] ?? null,
    error,
  };
};

export const safeQueryMany = async <T>(
  query: Promise<{ data: T[] | null; error: unknown }>
): Promise<{ data: T[]; error: unknown }> => {
  const { data, error } = await query;
  return {
    data: data ?? [],
    error,
  };
};

// Null-safe mutations
export const safeMutation = async <T>(
  mutation: Promise<{ data: T | null; error: unknown }>
): Promise<{ data: T | null; error: unknown }> => {
  return mutation;
};

// Type-safe RLS helpers
export const withUserId = (userId: string) => ({
  eq: (field: string) => ({
    field,
    operator: 'eq',
    value: userId,
  }),
});

// Common query patterns
export const buildInvoiceQuery = (userId: string, isAdmin: boolean = false) => {
  if (isAdmin) {
    return supabase.from('invoices').select('*');
  }
  return supabase
    .from('invoices')
    .select('*')
    .or(`lessor_id.eq.${userId},renter_id.eq.${userId}`);
};

export const buildSubscriptionQuery = (userId: string, isAdmin: boolean = false) => {
  if (isAdmin) {
    return supabase.from('subscriptions').select('*');
  }
  return supabase
    .from('subscriptions')
    .select('*')
    .or(`renter_id.eq.${userId},lessor_id.eq.${userId}`);
};

export const buildPaymentReminderQuery = (isAdmin: boolean = false) => {
  if (!isAdmin) {
    throw new Error('Payment reminders are admin-only');
  }
  return supabase.from('payment_reminders').select('*');
};

export const buildAccountingQuery = (userId: string, isAdmin: boolean = false) => {
  if (isAdmin) {
    return supabase.from('accounting_entries').select('*');
  }
  return supabase
    .from('accounting_entries')
    .select('*')
    .eq('lessor_id', userId);
};
