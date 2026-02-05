import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/azure/client';

interface Invoice {
  id: string;
  booking_id: string;
  lessor_id: string;
  renter_id: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled';
  amount_total: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  issue_date: string;
  due_date: string;
  sent_at?: string;
  viewed_at?: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateInvoiceData {
  booking_id: string;
  amount_total: number;
  due_date: string;
  notes?: string;
  payment_method?: string;
}

export const useInvoiceGeneration = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch invoices for a lessor
  const fetchInvoices = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase)
        .from('invoices')
        .select('*')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices((data as Invoice[]) || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente fakturaer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Generate invoice number (format: INV-YYYY-000001)
  const generateInvoiceNumber = useCallback(async (): Promise<string> => {
    const year = new Date().getFullYear();
    const { data } = await (supabase)
      .from('invoices')
      .select('invoice_number')
      .ilike('invoice_number', `INV-${year}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1);

    const lastNumber = data?.[0]?.invoice_number 
      ? parseInt(data[0].invoice_number.split('-').pop() || '0') 
      : 0;
    
    return `INV-${year}-${String(lastNumber + 1).padStart(6, '0')}`;
  }, []);

  // Create invoice
  const createInvoice = useCallback(async (invoiceData: CreateInvoiceData): Promise<Invoice | null> => {
    if (!user) return null;

    try {
      const invoiceNumber = await generateInvoiceNumber();

      const { data, error } = await (supabase)
        .from('invoices')
        .insert({
          ...invoiceData,
          lessor_id: user.id,
          invoice_number: invoiceNumber,
          status: 'draft',
          amount_paid: 0,
          amount_due: invoiceData.amount_total,
          currency: 'DKK',
          issue_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      const newInvoice = data as Invoice;
      setInvoices(prev => [newInvoice, ...prev]);

      toast({
        title: 'Faktura oprettet',
        description: invoiceNumber,
      });

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette faktura',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, generateInvoiceNumber, toast]);

  // Send invoice via email
  const sendInvoice = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      const { data: invoice, error: fetchError } = await (supabase)
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      // Update invoice status to sent
      const { error: updateError } = await (supabase)
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      // In real implementation, call email service here
      // await sendInvoiceEmail(invoice);

      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId
            ? {
                ...inv,
                status: 'sent' as const,
                sent_at: new Date().toISOString(),
              }
            : inv
        )
      );

      toast({
        title: 'Faktura sendt',
        description: `${invoice.invoice_number} blev sendt`,
      });

      return true;
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke sende faktura',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Record payment for invoice
  const recordPayment = useCallback(async (invoiceId: string, amount: number): Promise<boolean> => {
    try {
      const { data: invoice, error: fetchError } = await (supabase)
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (fetchError) throw fetchError;

      const newAmountPaid = invoice.amount_paid + amount;
      const newAmountDue = invoice.amount_total - newAmountPaid;
      const newStatus = newAmountDue <= 0 ? 'paid' : 'partially_paid';

      const { error: updateError } = await (supabase)
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          amount_due: Math.max(0, newAmountDue),
          status: newStatus,
        })
        .eq('id', invoiceId);

      if (updateError) throw updateError;

      setInvoices(prev =>
        prev.map(inv =>
          inv.id === invoiceId
            ? {
                ...inv,
                amount_paid: newAmountPaid,
                amount_due: Math.max(0, newAmountDue),
                status: newStatus as Invoice['status'],
              }
            : inv
        )
      );

      toast({
        title: 'Betaling registreret',
        description: `${amount} DKK registreret`,
      });

      return true;
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke registrere betaling',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Get invoice PDF (placeholder)
  const generateInvoicePDF = useCallback(async (invoiceId: string): Promise<Blob | null> => {
    try {
      // In real implementation, generate PDF using library like pdfkit
      console.log('Generating PDF for invoice:', invoiceId);
      return null;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  }, []);

  return {
    invoices,
    isLoading,
    fetchInvoices,
    createInvoice,
    sendInvoice,
    recordPayment,
    generateInvoicePDF,
  };
};
