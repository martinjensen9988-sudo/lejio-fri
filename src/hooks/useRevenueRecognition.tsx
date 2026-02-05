import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/azure/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

interface AccountingEntry {
  id: string;
  invoice_id?: string;
  subscription_id?: string;
  lessor_id: string;
  entry_type: 'invoice' | 'payment' | 'subscription' | 'refund' | 'adjustment';
  account_code: string;
  debit_amount?: number;
  credit_amount?: number;
  currency: string;
  description: string;
  reference_number?: string;
  posting_date: string;
  accounting_period: string;
  status: 'draft' | 'posted' | 'reconciled' | 'cancelled';
  external_id?: string;
  created_at: string;
  posted_at?: string;
}

interface RevenueMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netRevenue: number;
  pendingPayments: number;
  recognizedRevenue: number;
}

interface ChartOfAccounts {
  code: string;
  name: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
}

export const useRevenueRecognition = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Standard chart of accounts for rental business
  const chartOfAccounts: ChartOfAccounts[] = [
    { code: '4000', name: 'Rental Income', accountType: 'revenue' },
    { code: '4100', name: 'Late Payment Fees', accountType: 'revenue' },
    { code: '4200', name: 'Subscription Revenue', accountType: 'revenue' },
    { code: '5000', name: 'Vehicle Maintenance', accountType: 'expense' },
    { code: '5100', name: 'Insurance Costs', accountType: 'expense' },
    { code: '5200', name: 'Fuel/Energy Costs', accountType: 'expense' },
    { code: '1000', name: 'Cash Account', accountType: 'asset' },
    { code: '1200', name: 'Accounts Receivable', accountType: 'asset' },
  ];

  // Fetch accounting entries for a period
  const fetchEntries = useCallback(
    async (startDate: string, endDate: string) => {
      if (!user) return;
      setIsLoading(true);
      try {
        const { data, error } = await (supabase)
          .from('accounting_entries')
          .select('*')
          .eq('lessor_id', user.id)
          .gte('posting_date', startDate)
          .lte('posting_date', endDate)
          .order('posting_date', { ascending: false });

        if (error) throw error;
        setEntries((data as AccountingEntry[]) || []);
      } catch (error) {
        console.error('Error fetching entries:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke hente regnskabsposter',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast]
  );

  // Create accounting entry
  const createEntry = useCallback(
    async (entryData: Omit<AccountingEntry, 'id' | 'created_at' | 'lessor_id'>): Promise<AccountingEntry | null> => {
      if (!user) return null;

      try {
        const { data, error } = await (supabase)
          .from('accounting_entries')
          .insert({
            ...entryData,
            lessor_id: user.id,
            status: 'draft',
          })
          .select()
          .single();

        if (error) throw error;

        const newEntry = data as AccountingEntry;
        setEntries(prev => [newEntry, ...prev]);

        toast({
          title: 'Regnumpost oprettet',
          description: `${entryData.description}`,
        });

        return newEntry;
      } catch (error) {
        console.error('Error creating entry:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke oprette regnumpost',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user, toast]
  );

  // Post invoice to accounting
  const postInvoiceToAccounting = useCallback(
    async (
      invoiceId: string,
      amount: number,
      invoiceNumber: string
    ): Promise<boolean> => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const accountingPeriod = format(new Date(), 'yyyy-MM');

        // Create revenue entry
        const { error } = await (supabase)
          .from('accounting_entries')
          .insert({
            invoice_id: invoiceId,
            lessor_id: user?.id,
            entry_type: 'invoice',
            account_code: '4000', // Rental Income
            credit_amount: amount,
            currency: 'DKK',
            description: `Invoice ${invoiceNumber}`,
            reference_number: invoiceNumber,
            posting_date: today,
            accounting_period: accountingPeriod,
            status: 'posted',
            posted_at: new Date().toISOString(),
          });

        if (error) throw error;

        toast({
          title: 'Faktura bogført',
          description: `Faktura ${invoiceNumber} bogført i regnskab`,
        });

        return true;
      } catch (error) {
        console.error('Error posting invoice:', error);
        return false;
      }
    },
    [user, toast]
  );

  // Calculate revenue metrics
  const calculateMetrics = useCallback(
    (period: string): RevenueMetrics => {
      const periodEntries = entries.filter(e => e.accounting_period === period);

      const totalRevenue = periodEntries
        .filter(e => e.credit_amount && e.entry_type === 'invoice')
        .reduce((sum, e) => sum + (e.credit_amount || 0), 0);

      const totalExpenses = periodEntries
        .filter(e => e.debit_amount && e.entry_type !== 'invoice')
        .reduce((sum, e) => sum + (e.debit_amount || 0), 0);

      const recognizedRevenue = periodEntries
        .filter(e => e.status === 'posted')
        .reduce((sum, e) => sum + (e.credit_amount || 0), 0);

      const pendingPayments = totalRevenue - recognizedRevenue;

      return {
        totalRevenue,
        totalExpenses,
        netRevenue: totalRevenue - totalExpenses,
        pendingPayments,
        recognizedRevenue,
      };
    },
    [entries]
  );

  // Reconcile with external accounting system
  const reconcileWithExternalSystem = useCallback(
    async (
      systemName: string,
      entries_to_sync: AccountingEntry[]
    ): Promise<boolean> => {
      try {
        // In real implementation, call accounting API (Xero, Exact, etc.)
        console.log(`Syncing ${entries_to_sync.length} entries to ${systemName}`);

        // Update external_id for synced entries
        for (const entry of entries_to_sync) {
          await (supabase)
            .from('accounting_entries')
            .update({
              external_id: `${systemName}-${entry.id}`,
              status: 'reconciled',
            })
            .eq('id', entry.id);
        }

        toast({
          title: 'Synkronisering fuldført',
          description: `${entries_to_sync.length} poster synkroniseret`,
        });

        return true;
      } catch (error) {
        console.error('Error reconciling:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke synkronisere med regnskapssystem',
          variant: 'destructive',
        });
        return false;
      }
    },
    [toast]
  );

  // Generate trial balance
  const generateTrialBalance = useCallback(
    (period: string): Record<string, number> => {
      const periodEntries = entries.filter(e => e.accounting_period === period);
      const balances: Record<string, number> = {};

      periodEntries.forEach(entry => {
        const code = entry.account_code;
        balances[code] = (balances[code] || 0) +
          (entry.debit_amount || 0) -
          (entry.credit_amount || 0);
      });

      return balances;
    },
    [entries]
  );

  // Export entries for audit
  const exportForAudit = useCallback(
    async (startDate: string, endDate: string): Promise<boolean> => {
      try {
        const auditEntries = entries.filter(
          e =>
            e.posting_date >= startDate &&
            e.posting_date <= endDate
        );

        // Convert to CSV
        const headers = [
          'Date',
          'Description',
          'Reference',
          'Account Code',
          'Debit',
          'Credit',
          'Status',
        ];
        const rows = auditEntries.map(e => [
          e.posting_date,
          e.description,
          e.reference_number || '',
          e.account_code,
          e.debit_amount || '',
          e.credit_amount || '',
          e.status,
        ]);

        const csv = [headers, ...rows]
          .map(row => row.join(','))
          .join('\n');

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-export-${startDate}-to-${endDate}.csv`;
        link.click();

        return true;
      } catch (error) {
        console.error('Error exporting audit:', error);
        return false;
      }
    },
    [entries]
  );

  return {
    entries,
    isLoading,
    chartOfAccounts,
    fetchEntries,
    createEntry,
    postInvoiceToAccounting,
    calculateMetrics,
    reconcileWithExternalSystem,
    generateTrialBalance,
    exportForAudit,
  };
};
