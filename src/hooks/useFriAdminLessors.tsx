import { useState, useEffect } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface FriLessor {
  id: string;
  email: string;
  company_name: string;
  cvr_number?: string;
  custom_domain: string;
  primary_color: string;
  logo_url: string;
  trial_start_date?: string;
  trial_end_date?: string;
  subscription_status: 'trial' | 'active' | 'suspended' | 'cancelled';
  created_at: string;
}

export interface LessorStats {
  total_vehicles: number;
  total_bookings: number;
  total_revenue: number;
  total_invoices: number;
  active_bookings: number;
}

interface UseFriAdminLessorsReturn {
  lessors: FriLessor[];
  loading: boolean;
  error: string | null;
  stats: { [key: string]: LessorStats };
  fetchLessors: () => Promise<void>;
  getLessorStats: (lessorId: string) => Promise<LessorStats | null>;
  suspendLessor: (lessorId: string) => Promise<void>;
  activateLessor: (lessorId: string) => Promise<void>;
  deleteLessor: (lessorId: string) => Promise<void>;
}

export const useFriAdminLessors = (): UseFriAdminLessorsReturn => {
  const [lessors, setLessors] = useState<FriLessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [key: string]: LessorStats }>({});

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const fetchLessors = async () => {
    try {
      setError(null);
      setLoading(true);

      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT
          id,
          company_name,
          contact_email AS email,
          custom_domain,
          primary_color,
          logo_url,
          subscription_status,
          created_at
        FROM fri_lessors ORDER BY created_at DESC`,
      });

      const rows = normalizeRows(response) as FriLessor[];
      setLessors(rows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lessors';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const getLessorStats = async (lessorId: string): Promise<LessorStats | null> => {
    try {
      const safeLessorId = escapeSqlValue(lessorId);
      const [vehiclesRes, bookingsRes, invoicesRes, activeBookingsRes] = await Promise.all([
        azureApi.post<any>('/db/query', { query: `SELECT id FROM fri_vehicles WHERE lessor_id='${safeLessorId}'` }),
        azureApi.post<any>('/db/query', { query: `SELECT id, total_price FROM fri_bookings WHERE lessor_id='${safeLessorId}'` }),
        azureApi.post<any>('/db/query', { query: `SELECT id FROM fri_invoices WHERE lessor_id='${safeLessorId}'` }),
        azureApi.post<any>('/db/query', { query: `SELECT id FROM fri_bookings WHERE lessor_id='${safeLessorId}' AND status='confirmed'` }),
      ]);

      const vehicles = normalizeRows(vehiclesRes);
      const bookings = normalizeRows(bookingsRes) as Array<{ total_price?: number }>;
      const invoices = normalizeRows(invoicesRes);
      const activeBookingsRows = normalizeRows(activeBookingsRes);

      const totalVehicles = vehicles.length || 0;
      const totalBookings = bookings.length || 0;
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const totalInvoices = invoices.length || 0;
      const activeBookings = activeBookingsRows.length || 0;

      const lessorStats: LessorStats = {
        total_vehicles: totalVehicles,
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        total_invoices: totalInvoices,
        active_bookings: activeBookings,
      };

      setStats(prev => ({ ...prev, [lessorId]: lessorStats }));
      return lessorStats;
    } catch (err) {
      console.error('Error fetching lessor stats:', err);
      return null;
    }
  };

  const suspendLessor = async (lessorId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `UPDATE fri_lessors SET subscription_status='suspended' WHERE id='${escapeSqlValue(lessorId)}'`,
      });

      setLessors(lessors.map(l => 
        l.id === lessorId ? { ...l, subscription_status: 'suspended' } : l
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to suspend lessor';
      setError(message);
      throw err;
    }
  };

  const activateLessor = async (lessorId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `UPDATE fri_lessors SET subscription_status='active' WHERE id='${escapeSqlValue(lessorId)}'`,
      });

      setLessors(lessors.map(l => 
        l.id === lessorId ? { ...l, subscription_status: 'active' } : l
      ));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to activate lessor';
      setError(message);
      throw err;
    }
  };

  const deleteLessor = async (lessorId: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `DELETE FROM fri_lessors WHERE id='${escapeSqlValue(lessorId)}'`,
      });

      setLessors(lessors.filter(l => l.id !== lessorId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lessor';
      setError(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchLessors();
  }, []);

  return {
    lessors,
    loading,
    error,
    stats,
    fetchLessors,
    getLessorStats,
    suspendLessor,
    activateLessor,
    deleteLessor,
  };
};
