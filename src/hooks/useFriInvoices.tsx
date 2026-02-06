import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Invoice {
  id: string;
  lessor_id: string;
  booking_id?: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string;
  amount: number;
  tax_amount?: number;
  total_amount?: number;
  description?: string;
  issued_date?: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  paid_date?: string;
  payment_date?: string;
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
  description?: string;
  issued_date?: string;
  due_date: string;
  payment_method?: string;
  notes?: string;
}

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export function useFriInvoices(lessorId: string | null) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInvoiceNumber = useCallback((): string => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const r = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `INV-${y}${m}-${r}`;
  }, []);

  const fetchInvoices = useCallback(async () => {
    if (!lessorId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT *, created_at AS issued_date, notes AS description
                FROM fri_invoices
                WHERE lessor_id='${esc(lessorId)}'
                ORDER BY created_at DESC`,
      });
      setInvoices((normalizeRows(response) as Invoice[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices');
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  useEffect(() => { if (lessorId) fetchInvoices(); }, [lessorId, fetchInvoices]);

  const addInvoice = useCallback(async (input: CreateInvoiceInput) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);

    const invoiceNumber = input.invoice_number || generateInvoiceNumber();
    const taxAmount = input.tax_amount ?? 0;
    const totalAmount = input.amount + taxAmount;
    const bookingVal = input.booking_id ? `'${esc(input.booking_id)}'` : 'NULL';
    const methodVal = input.payment_method ? `'${esc(input.payment_method)}'` : 'NULL';
    const notesVal = input.notes || input.description ? `'${esc(input.notes || input.description || '')}'` : 'NULL';
    const dueDate = input.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    await azureApi.post('/db-query', {
      query: `INSERT INTO fri_invoices (lessor_id, booking_id, invoice_number, customer_name, email, amount, tax_amount, total_amount, status, payment_method, due_date, notes)
              VALUES ('${esc(lessorId)}', ${bookingVal}, '${esc(invoiceNumber)}', '${esc(input.customer_name)}', '${esc(input.customer_email)}', ${input.amount}, ${taxAmount}, ${totalAmount}, 'draft', ${methodVal}, '${esc(dueDate)}', ${notesVal})`,
    });

    await fetchInvoices();
    return null;
  }, [lessorId, generateInvoiceNumber, fetchInvoices]);

  const updateInvoice = useCallback(async (id: string, input: Partial<CreateInvoiceInput & { status: string; paid_date: string }>) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);

    const setClauses: string[] = [];
    if (input.amount !== undefined) setClauses.push(`amount=${input.amount}`);
    if (input.tax_amount !== undefined) setClauses.push(`tax_amount=${input.tax_amount}`);
    if (input.amount !== undefined || input.tax_amount !== undefined) {
      const amt = input.amount ?? 0;
      const tax = input.tax_amount ?? 0;
      setClauses.push(`total_amount=${amt + tax}`);
    }
    if (input.customer_name) setClauses.push(`customer_name='${esc(input.customer_name)}'`);
    if (input.customer_email) setClauses.push(`email='${esc(input.customer_email)}'`);
    if (input.due_date) setClauses.push(`due_date='${esc(input.due_date)}'`);
    if (input.status) setClauses.push(`status='${esc(input.status)}'`);
    if (input.payment_method) setClauses.push(`payment_method='${esc(input.payment_method)}'`);
    if (input.paid_date) setClauses.push(`payment_date='${esc(input.paid_date)}'`);
    if (input.notes !== undefined) setClauses.push(`notes=${input.notes ? `'${esc(input.notes)}'` : 'NULL'}`);

    if (setClauses.length > 0) {
      setClauses.push(`updated_at=NOW()`);
      await azureApi.post('/db-query', {
        query: `UPDATE fri_invoices SET ${setClauses.join(', ')} WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
      });
    }

    await fetchInvoices();
    return null;
  }, [lessorId, fetchInvoices]);

  const deleteInvoice = useCallback(async (id: string) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `DELETE FROM fri_invoices WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    setInvoices(prev => prev.filter(inv => inv.id !== id));
  }, [lessorId]);

  const updateStatus = useCallback(async (id: string, status: Invoice['status']) => {
    return updateInvoice(id, { status });
  }, [updateInvoice]);

  const sendInvoice = useCallback(async (id: string) => updateStatus(id, 'sent'), [updateStatus]);

  const markAsPaid = useCallback(async (id: string, paymentMethod?: string) => {
    const paidDate = new Date().toISOString().split('T')[0];
    return updateInvoice(id, { status: 'paid', payment_method: paymentMethod, paid_date: paidDate });
  }, [updateInvoice]);

  const calculateTotal = (amount: number, tax?: number, totalAmount?: number): number => {
    if (typeof totalAmount === 'number') return totalAmount;
    return amount + (tax || 0);
  };

  const isOverdue = (invoice: Invoice): boolean => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') return false;
    return new Date(invoice.due_date) < new Date();
  };

  return { invoices, loading, error, refetch: fetchInvoices, addInvoice, updateInvoice, deleteInvoice, updateStatus, sendInvoice, markAsPaid, calculateTotal, isOverdue, generateInvoiceNumber };
}
