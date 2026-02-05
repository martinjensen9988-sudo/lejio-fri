import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Booking {
  id: string;
  lessor_id: string;
  vehicle_id: string;
  vehicle_make?: string;
  vehicle_model?: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  number_of_days?: number;
  daily_rate?: number;
  base_price?: number;
  additional_fees?: number;
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

export function useFriBookings(lessorId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
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

  // Fetch all bookings for the lessor
  const fetch = useCallback(async () => {
    if (!lessorId) return;

    setLoading(true);
    setError(null);

    try {
      const safeLessorId = escapeSqlValue(lessorId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT 
          b.*, 
          b.pickup_date AS start_date,
          b.return_date AS end_date,
          c.full_name AS customer_name,
          c.email AS customer_email,
          c.phone AS customer_phone,
          v.make AS vehicle_make,
          v.model AS vehicle_model
        FROM fri_bookings b
        LEFT JOIN fri_customers c ON b.customer_id = c.id
        LEFT JOIN fri_vehicles v ON b.vehicle_id = v.id
        WHERE b.lessor_id='${safeLessorId}'
        ORDER BY b.pickup_date DESC`,
      });

      const rows = normalizeRows(response) as Booking[];
      setBookings(rows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch bookings';
      setError(message);
      console.error('Error fetching bookings:', err);
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

  // Create a new booking
  const addBooking = useCallback(
    async (input: CreateBookingInput) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        const safeLessorId = escapeSqlValue(lessorId);
        const safeVehicleId = escapeSqlValue(input.vehicle_id);
        const safeCustomerName = escapeSqlValue(input.customer_name);
        const safeCustomerEmail = escapeSqlValue(input.customer_email);
        const safeCustomerPhone = escapeSqlValue(input.customer_phone);
        const safeStartDate = escapeSqlValue(input.start_date);
        const safeEndDate = escapeSqlValue(input.end_date);
        const safeNotes = input.notes ? `'${escapeSqlValue(input.notes)}'` : 'NULL';
        const manualDailyRate = input.daily_rate ?? null;
        const totalPriceValue = input.total_price ?? null;

        const query = `
DECLARE @customer_id UNIQUEIDENTIFIER;
SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeCustomerEmail}';
IF @customer_id IS NULL
BEGIN
  INSERT INTO fri_customers (id, lessor_id, full_name, email, phone, is_verified, created_at, updated_at)
  VALUES (NEWID(), '${safeLessorId}', '${safeCustomerName}', '${safeCustomerEmail}', '${safeCustomerPhone}', 0, GETUTCDATE(), GETUTCDATE());
  SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeCustomerEmail}';
END

DECLARE @daily_rate DECIMAL(10,2);
SELECT @daily_rate = daily_rate FROM fri_vehicles WHERE id='${safeVehicleId}';
IF @daily_rate IS NULL SET @daily_rate = 0;
${manualDailyRate !== null ? `SET @daily_rate = ${manualDailyRate};` : ''}

DECLARE @pickup_date DATETIME2 = '${safeStartDate}';
DECLARE @return_date DATETIME2 = '${safeEndDate}';
DECLARE @days INT = CASE WHEN ABS(DATEDIFF(day, @pickup_date, @return_date)) < 1 THEN 1 ELSE ABS(DATEDIFF(day, @pickup_date, @return_date)) END;
DECLARE @base_price DECIMAL(10,2) = @daily_rate * @days;
DECLARE @total_price DECIMAL(10,2) = ${totalPriceValue === null ? 'NULL' : totalPriceValue};
DECLARE @additional_fees DECIMAL(10,2) = CASE WHEN @total_price IS NULL THEN 0 ELSE @total_price - @base_price END;

INSERT INTO fri_bookings (
  lessor_id,
  vehicle_id,
  customer_id,
  pickup_date,
  return_date,
  number_of_days,
  daily_rate,
  base_price,
  additional_fees,
  total_price,
  status,
  notes,
  created_at,
  updated_at
) VALUES (
  '${safeLessorId}',
  '${safeVehicleId}',
  @customer_id,
  @pickup_date,
  @return_date,
  @days,
  @daily_rate,
  @base_price,
  @additional_fees,
  COALESCE(@total_price, @base_price),
  'pending',
  ${safeNotes},
  GETUTCDATE(),
  GETUTCDATE()
);
`;

        await azureApi.post('/db/query', { query });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create booking';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Update a booking
  const updateBooking = useCallback(
    async (id: string, input: Partial<CreateBookingInput>) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        const safeId = escapeSqlValue(id);
        const safeLessorId = escapeSqlValue(lessorId);

        const setClauses: string[] = [];
        if (input.vehicle_id) setClauses.push(`vehicle_id='${escapeSqlValue(input.vehicle_id)}'`);
        if (input.start_date) setClauses.push(`pickup_date='${escapeSqlValue(input.start_date)}'`);
        if (input.end_date) setClauses.push(`return_date='${escapeSqlValue(input.end_date)}'`);
        if (input.total_price !== undefined) setClauses.push(`total_price=${input.total_price ?? 'NULL'}`);
        if (input.notes !== undefined) setClauses.push(`notes=${input.notes ? `'${escapeSqlValue(input.notes)}'` : 'NULL'}`);
        if ((input as any).status) setClauses.push(`status='${escapeSqlValue((input as any).status)}'`);

        if (input.start_date || input.end_date) {
          setClauses.push(`number_of_days = CASE WHEN ABS(DATEDIFF(day, pickup_date, return_date)) < 1 THEN 1 ELSE ABS(DATEDIFF(day, pickup_date, return_date)) END`);
          setClauses.push(`base_price = daily_rate * number_of_days`);
        }

        if (input.total_price !== undefined) {
          setClauses.push(`additional_fees = CASE WHEN total_price IS NULL THEN 0 ELSE total_price - (daily_rate * number_of_days) END`);
        }

        if (setClauses.length > 0) {
          await azureApi.post('/db/query', {
            query: `UPDATE fri_bookings SET ${setClauses.join(', ')} WHERE id='${safeId}' AND lessor_id='${safeLessorId}'`,
          });
        }

        if (input.customer_name || input.customer_email || input.customer_phone) {
          const customerUpdates: string[] = [];
          if (input.customer_name) customerUpdates.push(`full_name='${escapeSqlValue(input.customer_name)}'`);
          if (input.customer_email) customerUpdates.push(`email='${escapeSqlValue(input.customer_email)}'`);
          if (input.customer_phone) customerUpdates.push(`phone='${escapeSqlValue(input.customer_phone)}'`);

          if (customerUpdates.length > 0) {
            await azureApi.post('/db/query', {
              query: `UPDATE fri_customers SET ${customerUpdates.join(', ')} WHERE id=(SELECT customer_id FROM fri_bookings WHERE id='${safeId}' AND lessor_id='${safeLessorId}')`,
            });
          }
        }

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update booking';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Delete a booking
  const deleteBooking = useCallback(
    async (id: string) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        await azureApi.post('/db/query', {
          query: `DELETE FROM fri_bookings WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        setBookings((prev) => prev.filter((b) => b.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete booking';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Update booking status
  const updateStatus = useCallback(
    async (id: string, status: Booking['status']) => {
      return updateBooking(id, { status } as any);
    },
    [updateBooking]
  );

  // Calculate days between dates
  const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  };

  return {
    bookings,
    loading,
    error,
    refetch: fetch,
    addBooking,
    updateBooking,
    deleteBooking,
    updateStatus,
    calculateDays,
  };
}
