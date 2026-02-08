import { useState, useEffect } from 'react';
import { api as azureApi } from '@/integrations/api/client';

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

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export const useFriAdminLessors = (): UseFriAdminLessorsReturn => {
  const [lessors, setLessors] = useState<FriLessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [key: string]: LessorStats }>({});

  const fetchLessors = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT id, company_name, email, custom_domain, primary_color, logo_url, subscription_status, created_at
                FROM fri_lessors ORDER BY created_at DESC`,
        admin: true,
      });
      setLessors((normalizeRows(response) as FriLessor[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessors');
    } finally {
      setLoading(false);
    }
  };

  const getLessorStats = async (lessorId: string): Promise<LessorStats | null> => {
    try {
      const safeLessorId = esc(lessorId);
      const [vehiclesRes, bookingsRes, invoicesRes, activeRes] = await Promise.all([
        azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_vehicles WHERE lessor_id='${safeLessorId}'`, admin: true }),
        azureApi.post<any>('/db-query', { query: `SELECT id, total_price FROM fri_bookings WHERE lessor_id='${safeLessorId}'`, admin: true }),
        azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_invoices WHERE lessor_id='${safeLessorId}'`, admin: true }),
        azureApi.post<any>('/db-query', { query: `SELECT id FROM fri_bookings WHERE lessor_id='${safeLessorId}' AND status='confirmed'`, admin: true }),
      ]);
      const vehicles = normalizeRows(vehiclesRes);
      const bookings = normalizeRows(bookingsRes) as Array<{ total_price?: number }>;
      const invoices = normalizeRows(invoicesRes);
      const activeBookings = normalizeRows(activeRes);
      const lessorStats: LessorStats = {
        total_vehicles: vehicles.length, total_bookings: bookings.length,
        total_revenue: bookings.reduce((s, b) => s + (b.total_price || 0), 0),
        total_invoices: invoices.length, active_bookings: activeBookings.length,
      };
      setStats(prev => ({ ...prev, [lessorId]: lessorStats }));
      return lessorStats;
    } catch (err) {
      console.error('Error fetching lessor stats:', err);
      return null;
    }
  };

  const suspendLessor = async (lessorId: string) => {
    await azureApi.post('/db-query', { query: `UPDATE fri_lessors SET subscription_status='suspended' WHERE id='${esc(lessorId)}'`, admin: true });
    setLessors(prev => prev.map(l => l.id === lessorId ? { ...l, subscription_status: 'suspended' as const } : l));
  };

  const activateLessor = async (lessorId: string) => {
    await azureApi.post('/db-query', { query: `UPDATE fri_lessors SET subscription_status='active' WHERE id='${esc(lessorId)}'`, admin: true });
    setLessors(prev => prev.map(l => l.id === lessorId ? { ...l, subscription_status: 'active' as const } : l));
  };

  const deleteLessor = async (lessorId: string) => {
    await azureApi.post('/db-query', { query: `DELETE FROM fri_lessors WHERE id='${esc(lessorId)}'`, admin: true });
    setLessors(prev => prev.filter(l => l.id !== lessorId));
  };

  useEffect(() => { fetchLessors(); }, []);

  return { lessors, loading, error, stats, fetchLessors, getLessorStats, suspendLessor, activateLessor, deleteLessor };
};
