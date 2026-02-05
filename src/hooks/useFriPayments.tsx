import { useState, useEffect } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Payment {
  id: string;
  lessor_id: string;
  lessor_name: string;
  lessor_email: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: 'card' | 'bank_transfer' | 'paypal';
  subscription_type: 'trial' | 'monthly' | 'yearly';
  reference: string;
  notes: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
}

export interface PaymentStats {
  total_revenue: number;
  completed_payments: number;
  pending_payments: number;
  failed_payments: number;
  avg_payment: number;
  monthly_data: { month: string; revenue: number }[];
}

interface UseFriPaymentsReturn {
  payments: Payment[];
  stats: PaymentStats | null;
  loading: boolean;
  error: string | null;
  fetchPayments: (filter?: string) => Promise<void>;
  getPaymentStats: () => Promise<PaymentStats | null>;
  updatePaymentStatus: (paymentId: string, status: Payment['status']) => Promise<void>;
  recordManualPayment: (lessorId: string, amount: number, method: string, notes: string) => Promise<void>;
}

export const useFriPayments = (): UseFriPaymentsReturn => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchPayments = async (filter?: string) => {
    try {
      setError(null);
      setLoading(true);

      const statusFilter = filter && filter !== 'all'
        ? ` AND status='${escapeSqlValue(filter)}'`
        : '';

      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT * FROM fri_payments WHERE 1=1${statusFilter} ORDER BY created_at DESC`,
      });

      const rows = normalizeRows(response) as Payment[];
      setPayments(rows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved indlæsning af betalinger';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStats = async (): Promise<PaymentStats | null> => {
    try {
      const response = await azureApi.post<any>('/db/query', {
        query: 'SELECT * FROM fri_payments',
      });

      const paymentsData = normalizeRows(response) as Payment[];

      const totalRevenue = paymentsData
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

      const completedPayments = paymentsData.filter(p => p.status === 'completed').length;
      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
      const failedPayments = paymentsData.filter(p => p.status === 'failed').length;
      const avgPayment = completedPayments > 0 ? totalRevenue / completedPayments : 0;

      // Calculate monthly data
      const monthlyMap = new Map<string, number>();
      paymentsData
        .filter(p => p.status === 'completed')
        .forEach(payment => {
          const month = new Date(payment.created_at).toLocaleDateString('da-DK', {
            year: 'numeric',
            month: 'short',
          });
          monthlyMap.set(month, (monthlyMap.get(month) || 0) + payment.amount);
        });

      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, revenue]) => ({ month, revenue }))
        .slice(-12);

      const statsData: PaymentStats = {
        total_revenue: totalRevenue,
        completed_payments: completedPayments,
        pending_payments: pendingPayments,
        failed_payments: failedPayments,
        avg_payment: avgPayment,
        monthly_data: monthlyData,
      };

      setStats(statsData);
      return statsData;
    } catch (err) {
      console.error('Error fetching payment stats:', err);
      return null;
    }
  };

  const updatePaymentStatus = async (paymentId: string, status: Payment['status']) => {
    try {
      const updatedAt = new Date().toISOString();
      const paidAt = status === 'completed' ? updatedAt : null;

      await azureApi.post('/db/query', {
        query: `UPDATE fri_payments SET status='${escapeSqlValue(status)}', updated_at='${escapeSqlValue(updatedAt)}', paid_at=${paidAt ? `'${escapeSqlValue(paidAt)}'` : 'NULL'} WHERE id='${escapeSqlValue(paymentId)}'`,
      });

      setPayments(payments.map(p =>
        p.id === paymentId
          ? {
              ...p,
              status,
              updated_at: new Date().toISOString(),
              paid_at: status === 'completed' ? new Date().toISOString() : undefined,
            }
          : p
      ));

      // Update stats
      await getPaymentStats();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved opdatering af betaling';
      setError(message);
      throw err;
    }
  };

  const recordManualPayment = async (lessorId: string, amount: number, method: string, notes: string) => {
    try {
      const paidAt = new Date().toISOString();
      const reference = `MANUAL-${Date.now()}`;

      await azureApi.post('/db/query', {
        query: `INSERT INTO fri_payments (lessor_id, amount, currency, status, payment_method, subscription_type, reference, notes, paid_at) VALUES ('${escapeSqlValue(lessorId)}', ${amount}, 'DKK', 'completed', '${escapeSqlValue(method)}', 'monthly', '${escapeSqlValue(reference)}', '${escapeSqlValue(notes)}', '${escapeSqlValue(paidAt)}')`,
      });

      // Reload payments
      await fetchPayments();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fejl ved registrering af betaling';
      setError(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
    getPaymentStats();
  }, []);

  return {
    payments,
    stats,
    loading,
    error,
    fetchPayments,
    getPaymentStats,
    updatePaymentStatus,
    recordManualPayment,
  };
};
