import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Invoice {
  id: string;
  lessor_id: string;
  booking_id?: string;
  customer_id?: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  tax_amount?: number;
  discount_amount?: number;
  total_amount?: number;
  description: string;
  issued_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  paid_date?: string;
  pdf_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  booking_id?: string;
  invoice_number?: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  tax_amount?: number;
  discount_amount?: number;
  description: string;
  issued_date: string;
  due_date: string;
  payment_method?: string;
  notes?: string;
}

export function useFriInvoices(lessorId: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  // Generate invoice number
  const generateInvoiceNumber = useCallback((): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }, []);

  // Fetch all invoices for the lessor
  const fetch = useCallback(async () => {
    if (!lessorId) return;

    setLoading(true);
    setError(null);

    try {
      const safeLessorId = escapeSqlValue(lessorId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT 
          i.*, 
          i.invoice_date AS issued_date,
          i.net_amount AS amount,
          i.notes AS description,
          c.full_name AS customer_name,
          c.email AS customer_email
        FROM fri_invoices i
        LEFT JOIN fri_customers c ON i.customer_id = c.id
        WHERE i.lessor_id='${safeLessorId}'
        ORDER BY i.invoice_date DESC`,
      });

      const rows = normalizeRows(response) as Invoice[];
      setInvoices(rows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch invoices';
      setError(message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  // Auto-fetch when component mounts or lessorId changes
  useEffect(() => {
    if (lessorId) {
      fetch();
    }
  }, [lessorId, fetch]);

  // Create a new invoice
  const addInvoice = useCallback(
    async (input: CreateInvoiceInput) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        const invoiceNumber = input.invoice_number || generateInvoiceNumber();
        const safeLessorId = escapeSqlValue(lessorId);
        const safeCustomerName = escapeSqlValue(input.customer_name);
        const safeCustomerEmail = escapeSqlValue(input.customer_email);
        const safeInvoiceDate = escapeSqlValue(input.issued_date);
        const safeDueDate = escapeSqlValue(input.due_date);
        const safePaymentMethod = input.payment_method ? `'${escapeSqlValue(input.payment_method)}'` : 'NULL';
        const notesValue = input.notes || input.description ? `'${escapeSqlValue(input.notes || input.description)}'` : 'NULL';
        const paidDateValue = (input as any).paid_date ? `'${escapeSqlValue((input as any).paid_date)}'` : 'NULL';
        const discountValue = input.discount_amount ?? 0;
        const totalAmount = input.amount + (input.tax_amount || 0) - (discountValue || 0);

        const query = `
DECLARE @customer_id UNIQUEIDENTIFIER;
SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeCustomerEmail}';
IF @customer_id IS NULL
BEGIN
  INSERT INTO fri_customers (id, lessor_id, full_name, email, is_verified, created_at, updated_at)
  VALUES (NEWID(), '${safeLessorId}', '${safeCustomerName}', '${safeCustomerEmail}', 0, GETUTCDATE(), GETUTCDATE());
  SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeCustomerEmail}';
END

INSERT INTO fri_invoices (
  lessor_id,
  booking_id,
  customer_id,
  invoice_number,
  invoice_date,
  due_date,
  net_amount,
  tax_amount,
  discount_amount,
  total_amount,
  status,
  payment_method,
  notes,
  created_at,
  updated_at
) VALUES (
  '${safeLessorId}',
  ${input.booking_id ? `'${escapeSqlValue(input.booking_id)}'` : 'NULL'},
  @customer_id,
  '${escapeSqlValue(invoiceNumber)}',
  '${safeInvoiceDate}',
  '${safeDueDate}',
  ${input.amount},
  ${input.tax_amount ?? 'NULL'},
  ${input.discount_amount ?? 'NULL'},
  ${totalAmount},
  'draft',
  ${safePaymentMethod},
  ${notesValue},
  GETUTCDATE(),
  GETUTCDATE()
);
`;

        await azureApi.post('/db/query', { query });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create invoice';
        setError(message);
        throw err;
      }
    },
    [lessorId, generateInvoiceNumber]
  );

  // Update an invoice
  const updateInvoice = useCallback(
    async (id: string, input: Partial<CreateInvoiceInput>) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        const safeId = escapeSqlValue(id);
        const safeLessorId = escapeSqlValue(lessorId);
        const amountValue = input.amount ?? null;
        const taxValue = input.tax_amount ?? null;
        const discountValue = input.discount_amount ?? null;
        const issuedDateValue = input.issued_date ? `'${escapeSqlValue(input.issued_date)}'` : 'NULL';
        const dueDateValue = input.due_date ? `'${escapeSqlValue(input.due_date)}'` : 'NULL';
        const statusValue = (input as any).status ? `'${escapeSqlValue((input as any).status)}'` : 'NULL';
        const paymentMethodValue = input.payment_method ? `'${escapeSqlValue(input.payment_method)}'` : 'NULL';
        const notesValue = input.notes || input.description ? `'${escapeSqlValue(input.notes || input.description)}'` : 'NULL';
        const paidDateValue = (input as any).paid_date ? `'${escapeSqlValue((input as any).paid_date)}'` : 'NULL';

        const query = `
DECLARE @amount DECIMAL(10,2) = ${amountValue === null ? 'NULL' : amountValue};
DECLARE @tax_amount DECIMAL(10,2) = ${taxValue === null ? 'NULL' : taxValue};
DECLARE @discount_amount DECIMAL(10,2) = ${discountValue === null ? 'NULL' : discountValue};
DECLARE @invoice_date DATE = ${issuedDateValue};
DECLARE @due_date DATE = ${dueDateValue};
DECLARE @status NVARCHAR(100) = ${statusValue};
DECLARE @payment_method NVARCHAR(100) = ${paymentMethodValue};
DECLARE @notes NVARCHAR(MAX) = ${notesValue};
DECLARE @paid_date DATE = ${paidDateValue};

UPDATE fri_invoices
SET
  net_amount = COALESCE(@amount, net_amount),
  tax_amount = COALESCE(@tax_amount, tax_amount),
  discount_amount = COALESCE(@discount_amount, discount_amount),
  total_amount = COALESCE(@amount, net_amount) + COALESCE(@tax_amount, tax_amount, 0) - COALESCE(@discount_amount, discount_amount, 0),
  invoice_date = COALESCE(@invoice_date, invoice_date),
  due_date = COALESCE(@due_date, due_date),
  status = COALESCE(@status, status),
  payment_method = COALESCE(@payment_method, payment_method),
  paid_date = COALESCE(@paid_date, paid_date),
  notes = COALESCE(@notes, notes),
  updated_at = GETUTCDATE()
WHERE id='${safeId}' AND lessor_id='${safeLessorId}';
`;

        await azureApi.post('/db/query', { query });

        if (input.customer_name || input.customer_email) {
          const customerUpdates: string[] = [];
          if (input.customer_name) customerUpdates.push(`full_name='${escapeSqlValue(input.customer_name)}'`);
          if (input.customer_email) customerUpdates.push(`email='${escapeSqlValue(input.customer_email)}'`);

          if (customerUpdates.length > 0) {
            await azureApi.post('/db/query', {
              query: `UPDATE fri_customers SET ${customerUpdates.join(', ')} WHERE id=(SELECT customer_id FROM fri_invoices WHERE id='${safeId}' AND lessor_id='${safeLessorId}')`,
            });
          }
        }

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update invoice';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Delete an invoice
  const deleteInvoice = useCallback(
    async (id: string) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        await azureApi.post('/db/query', {
          query: `DELETE FROM fri_invoices WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        setInvoices((prev) => prev.filter((inv) => inv.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete invoice';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Update invoice status
  const updateStatus = useCallback(
    async (id: string, status: Invoice['status']) => {
      return updateInvoice(id, { status } as any);
    },
    [updateInvoice]
  );

  // Send invoice (mark as sent)
  const sendInvoice = useCallback(
    async (id: string) => {
      return updateStatus(id, 'sent');
    },
    [updateStatus]
  );

  // Mark as paid
  const markAsPaid = useCallback(
    async (id: string, paymentMethod?: string) => {
      const paidDate = new Date().toISOString().split('T')[0];
      return updateInvoice(id, { status: 'paid', payment_method: paymentMethod, paid_date: paidDate } as any);
    },
    [updateInvoice]
  );

  // Calculate total (amount + tax)
  const calculateTotal = (amount: number, tax?: number, totalAmount?: number): number => {
    if (typeof totalAmount === 'number') return totalAmount;
    return amount + (tax || 0);
  };

  // Check if invoice is overdue
  const isOverdue = (invoice: Invoice): boolean => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    return new Date(invoice.due_date) < new Date();
  };

  return {
    invoices,
    loading,
    error,
    refetch: fetch,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    updateStatus,
    sendInvoice,
    markAsPaid,
    calculateTotal,
    isOverdue,
    generateInvoiceNumber,
  };
}
