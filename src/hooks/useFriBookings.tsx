import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Booking {
  id: string;
  lessor_id: string;
  vehicle_id: string;
  vehicle_make?: string;
  vehicle_model?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  rental_days?: number;
  daily_rate?: number;
  total_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingInput {
  vehicle_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  daily_rate?: number;
  total_price?: number;
  notes?: string;
  status?: Booking['status'];
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

export function useFriBookings(lessorId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  const fetchBookings = useCallback(async () => {
    if (!lessorId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT b.*, b.email AS customer_email, b.phone AS customer_phone,
                v.make AS vehicle_make, v.model AS vehicle_model
                FROM fri_bookings b
                LEFT JOIN fri_vehicles v ON b.vehicle_id = v.id
                WHERE b.lessor_id='${esc(lessorId)}'
                ORDER BY b.start_date DESC`,
      });
      setBookings((normalizeRows(response) as Booking[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  useEffect(() => { if (lessorId) fetchBookings(); }, [lessorId, fetchBookings]);

  const addBooking = useCallback(async (input: CreateBookingInput) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);

    const days = calculateDays(input.start_date, input.end_date);
    const rate = input.daily_rate ?? 0;
    const total = input.total_price ?? (rate * days);
    const notesVal = input.notes ? `'${esc(input.notes)}'` : 'NULL';
    const phoneVal = input.customer_phone ? `'${esc(input.customer_phone)}'` : 'NULL';

    await azureApi.post('/db-query', {
      query: `INSERT INTO fri_bookings (lessor_id, vehicle_id, customer_name, email, phone, start_date, end_date, rental_days, daily_rate, total_price, status, notes)
              VALUES ('${esc(lessorId)}', '${esc(input.vehicle_id)}', '${esc(input.customer_name)}', '${esc(input.customer_email)}', ${phoneVal}, '${esc(input.start_date)}', '${esc(input.end_date)}', ${days}, ${rate}, ${total}, '${input.status || 'pending'}', ${notesVal})`,
    });

    await fetchBookings();
    return null;
  }, [lessorId, fetchBookings]);

  const updateBooking = useCallback(async (id: string, input: Partial<CreateBookingInput>) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);

    const setClauses: string[] = [];
    if (input.vehicle_id) setClauses.push(`vehicle_id='${esc(input.vehicle_id)}'`);
    if (input.customer_name) setClauses.push(`customer_name='${esc(input.customer_name)}'`);
    if (input.customer_email) setClauses.push(`email='${esc(input.customer_email)}'`);
    if (input.customer_phone) setClauses.push(`phone='${esc(input.customer_phone)}'`);
    if (input.start_date) setClauses.push(`start_date='${esc(input.start_date)}'`);
    if (input.end_date) setClauses.push(`end_date='${esc(input.end_date)}'`);
    if (input.daily_rate !== undefined) setClauses.push(`daily_rate=${input.daily_rate}`);
    if (input.total_price !== undefined) setClauses.push(`total_price=${input.total_price ?? 'NULL'}`);
    if (input.notes !== undefined) setClauses.push(`notes=${input.notes ? `'${esc(input.notes)}'` : 'NULL'}`);
    if ((input as any).status) setClauses.push(`status='${esc((input as any).status)}'`);

    if (input.start_date && input.end_date) {
      const days = calculateDays(input.start_date, input.end_date);
      setClauses.push(`rental_days=${days}`);
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at=NOW()`);
      await azureApi.post('/db-query', {
        query: `UPDATE fri_bookings SET ${setClauses.join(', ')} WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
      });
    }

    await fetchBookings();
    return null;
  }, [lessorId, fetchBookings]);

  const deleteBooking = useCallback(async (id: string) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `DELETE FROM fri_bookings WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    setBookings(prev => prev.filter(b => b.id !== id));
  }, [lessorId]);

  const updateStatus = useCallback(async (id: string, status: Booking['status']) => {
    return updateBooking(id, { status } as any);
  }, [updateBooking]);

  return { bookings, loading, error, refetch: fetchBookings, addBooking, updateBooking, deleteBooking, updateStatus, calculateDays };
}
