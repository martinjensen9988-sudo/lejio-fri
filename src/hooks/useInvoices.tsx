import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  lessor_id: string;
  booking_id: string | null;
  renter_email: string;
  renter_name: string | null;
  renter_address: string | null;
  renter_cvr: string | null;
  subtotal: number;
  vat_amount: number;
  total_amount: number;
  currency: string;
  status: string;
  issued_at: string | null;
  due_date: string | null;
  paid_at: string | null;
  pdf_url: string | null;
  line_items: unknown;
  created_at: string;
}

export const useInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    if (!user) {
      setInvoices([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const generateInvoice = async (bookingId: string, includeVat = true) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: { bookingId, includeVat }
      });

      if (error) throw error;

      if (data.invoice) {
        setInvoices(prev => [data.invoice, ...prev]);
        toast.success(`Faktura ${data.invoice.invoice_number} oprettet`);
        return data.invoice;
      }
      
      throw new Error(data.error || 'Kunne ikke oprette faktura');
    } catch (error: unknown) {
      console.error('Error generating invoice:', error);
      toast.error(error.message || 'Kunne ikke oprette faktura');
      return null;
    }
  };

  const markAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.map(inv => 
        inv.id === id 
          ? { ...inv, status: 'paid', paid_at: new Date().toISOString() } 
          : inv
      ));
      toast.success('Faktura markeret som betalt');
      return true;
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      toast.error('Kunne ikke opdatere faktura');
      return false;
    }
  };

  const cancelInvoice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      setInvoices(prev => prev.map(inv => 
        inv.id === id ? { ...inv, status: 'cancelled' } : inv
      ));
      toast.success('Faktura annulleret');
      return true;
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      toast.error('Kunne ikke annullere faktura');
      return false;
    }
  };

  const getUnpaidInvoices = () => invoices.filter(i => i.status === 'issued');
  const getPaidInvoices = () => invoices.filter(i => i.status === 'paid');
  const getOverdueInvoices = () => {
    const today = new Date();
    return invoices.filter(i => 
      i.status === 'issued' && 
      i.due_date && 
      new Date(i.due_date) < today
    );
  };

  // Generate settlement/final invoice for extra charges at end of rental
  const generateSettlementInvoice = async (bookingId: string, settlement: unknown) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-settlement-invoice', {
        body: { bookingId, settlement }
      });

      if (error) throw error;

      if (data && data.invoice) {
        setInvoices(prev => [data.invoice, ...prev]);
        toast.success(`Afregningsfaktura ${data.invoice.invoice_number} oprettet`);
        return data.invoice;
      }

      throw new Error(data?.error || 'Kunne ikke oprette afregningsfaktura');
    } catch (error: unknown) {
      console.error('Error generating settlement invoice:', error);
      toast.error(error.message || 'Kunne ikke oprette afregningsfaktura');
      return null;
    }
  };

  return {
    invoices,
    isLoading,
    generateInvoice,
    generateSettlementInvoice,
    markAsPaid,
    cancelInvoice,
    getUnpaidInvoices,
    getPaidInvoices,
    getOverdueInvoices,
    refetch: fetchInvoices,
  };
};
