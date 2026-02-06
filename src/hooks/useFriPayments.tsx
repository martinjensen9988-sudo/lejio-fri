import { useState, useEffect } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Payment {
  id: string;
  lessor_id: string;
  lessor_name?: string;
  lessor_email?: string;
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

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export const useFriPayments = (): UseFriPaymentsReturn => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async (filter?: string) => {
    try {
      setError(null);
      setLoading(true);
      const statusFilter = filter && filter !== 'all' ? ` AND p.status='${esc(filter)}'` : '';
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT p.*, l.company_name AS lessor_name, l.email AS lessor_email
                FROM fri_payments p
                LEFT JOIN fri_lessors l ON p.lessor_id = l.id
                WHERE 1=1${statusFilter}
                ORDER BY p.created_at DESC`,
        admin: true,
      });
      setPayments((normalizeRows(response) as Payment[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved indlæsning af betalinger');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStats = async (): Promise<PaymentStats | null> => {
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: 'SELECT * FROM fri_payments',
        admin: true,
      });
      const data = normalizeRows(response) as Payment[];
      const totalRevenue = data.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
      const completedPayments = data.filter(p => p.status === 'completed').length;
      const pendingPayments = data.filter(p => p.status === 'pending').length;
      const failedPayments = data.filter(p => p.status === 'failed').length;
      const avgPayment = completedPayments > 0 ? totalRevenue / completedPayments : 0;

      const monthlyMap = new Map<string, number>();
      data.filter(p => p.status === 'completed').forEach(p => {
        const month = new Date(p.created_at).toLocaleDateString('da-DK', { year: 'numeric', month: 'short' });
        monthlyMap.set(month, (monthlyMap.get(month) || 0) + p.amount);
      });
      const monthlyData = Array.from(monthlyMap.entries()).map(([month, revenue]) => ({ month, revenue })).slice(-12);

      const statsData: PaymentStats = { total_revenue: totalRevenue, completed_payments: completedPayments, pending_payments: pendingPayments, failed_payments: failedPayments, avg_payment: avgPayment, monthly_data: monthlyData };
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
      await azureApi.post('/db-query', {
        query: `UPDATE fri_payments SET status='${esc(status)}', updated_at='${esc(updatedAt)}', paid_at=${paidAt ? `'${esc(paidAt)}'` : 'NULL'} WHERE id='${esc(paymentId)}'`,
        admin: true,
      });
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status, updated_at: updatedAt, paid_at: status === 'completed' ? updatedAt : undefined } : p));
      await getPaymentStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved opdatering af betaling');
      throw err;
    }
  };

  const recordManualPayment = async (lessorId: string, amount: number, method: string, notes: string) => {
    try {
      const paidAt = new Date().toISOString();
      const reference = `MANUAL-${Date.now()}`;
      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_payments (lessor_id, amount, currency, status, payment_method, subscription_type, reference, notes, paid_at)
                VALUES ('${esc(lessorId)}', ${amount}, 'DKK', 'completed', '${esc(method)}', 'monthly', '${esc(reference)}', '${esc(notes)}', '${esc(paidAt)}')`,
        admin: true,
      });
      await fetchPayments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fejl ved registrering af betaling');
      throw err;
    }
  };

  useEffect(() => {
    fetchPayments();
    getPaymentStats();
  }, []);

  return { payments, stats, loading, error, fetchPayments, getPaymentStats, updatePaymentStatus, recordManualPayment };
};
