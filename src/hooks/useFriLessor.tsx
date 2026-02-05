import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';
import { useFriAuth } from '@/hooks/useFriAuth';
import { toast } from 'sonner';

export interface FriLessor {
  id: string;
  company_name: string;
  contact_name?: string;
  contact_email: string;
  contact_phone: string | null;
  billing_address?: string | null;
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  created_at: string;
}

export interface FriTeamMember {
  id: string;
  lessor_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: 'manager' | 'driver' | 'mechanic' | 'accountant';
  is_active: boolean;
  created_at: string;
}

export interface FriVehicle {
  id: string;
  lessor_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  daily_rate: number;
  image_url: string | null;
  status: 'available' | 'booked' | 'maintenance' | 'retired';
  created_at: string;
}

export interface FriBooking {
  id: string;
  lessor_id: string;
  vehicle_id: string;
  renter_name?: string;
  renter_phone?: string | null;
  renter_email?: string;
  start_date: string;
  end_date: string;
  daily_rate: number;
  additional_fees: number | null;
  total_price: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  created_at: string;
}

export interface FriInvoice {
  id: string;
  lessor_id: string;
  booking_id: string;
  invoice_number: string;
  total_amount: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  created_at: string;
  due_date: string;
  paid_date?: string;
}

export const useFriLessor = () => {
  const auth = useFriAuth();
  const lessorId = auth.user?.lessor_id;
  const [friLessor, setFriLessor] = useState<FriLessor | null>(null);
  const [teamMembers, setTeamMembers] = useState<FriTeamMember[]>([]);
  const [vehicles, setVehicles] = useState<FriVehicle[]>([]);
  const [bookings, setBookings] = useState<FriBooking[]>([]);
  const [invoices, setInvoices] = useState<FriInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const fetchFriData = useCallback(async () => {
    if (!lessorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch all related data in parallel
      const safeLessorId = escapeSqlValue(lessorId);

      const [lessorRes, teamRes, vehiclesRes, bookingsRes, invoicesRes] = await Promise.all([
        azureApi.post<any>("/db/query", { query: `SELECT id, company_name, contact_email, contact_phone, subscription_status AS status, created_at FROM fri_lessors WHERE id='${safeLessorId}'` }),
        azureApi.post<any>("/db/query", { query: `SELECT * FROM fri_lessor_team_members WHERE lessor_id='${safeLessorId}' AND is_active=1` }),
        azureApi.post<any>("/db/query", { query: `SELECT *, status AS availability_status FROM fri_vehicles WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC` }),
        azureApi.post<any>("/db/query", { query: `SELECT 
          b.*, 
          b.pickup_date AS start_date,
          b.return_date AS end_date,
          c.full_name AS renter_name,
          c.email AS renter_email,
          c.phone AS renter_phone
        FROM fri_bookings b
        LEFT JOIN fri_customers c ON b.customer_id = c.id
        WHERE b.lessor_id='${safeLessorId}'
        ORDER BY b.created_at DESC OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY` }),
        azureApi.post<any>("/db/query", { query: `SELECT *, invoice_date AS issued_date, total_amount AS total_amount FROM fri_invoices WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC` }),
      ]);

      const lessorRows = normalizeRows(lessorRes);
      const teamRows = normalizeRows(teamRes);
      const vehicleRows = normalizeRows(vehiclesRes);
      const bookingRows = normalizeRows(bookingsRes);
      const invoiceRows = normalizeRows(invoicesRes);

      if (lessorRows?.[0]) setFriLessor(lessorRows[0] as FriLessor);
      setTeamMembers((teamRows || []) as FriTeamMember[]);
      setVehicles((vehicleRows || []) as FriVehicle[]);
      setBookings((bookingRows || []) as FriBooking[]);
      setInvoices((invoiceRows || []) as FriInvoice[]);

    } catch (error) {
      console.error('Error fetching Fri data:', error);
      toast.error('Kunne ikke hente data');
    } finally {
      setIsLoading(false);
    }
  }, [lessorId]);

  useEffect(() => {
    fetchFriData();
  }, [fetchFriData]);

  const createTeamMember = async (member: { full_name: string; email: string; phone?: string; role: 'manager' | 'driver' | 'mechanic' | 'accountant' }) => {
    if (!lessorId) {
      toast.error('Lessor ID ikke fundet');
      return null;
    }

    try {
      await azureApi.post(`/db/fri_lessor_team_members`, {
        records: [
          {
            lessor_id: lessorId,
            full_name: member.full_name,
            email: member.email,
            phone: member.phone || null,
            role: member.role,
            is_active: true,
          },
        ],
      });

      toast.success('Teammedlem oprettet');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error creating team member:', error);
      toast.error('Kunne ikke oprette teammedlem');
      return null;
    }
  };

  const updateTeamMember = async (memberId: string, updates: Partial<FriTeamMember>) => {
    try {
      await azureApi.put(`/db/fri_lessor_team_members`, { id: memberId, ...updates });

      toast.success('Teammedlem opdateret');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('Kunne ikke opdatere teammedlem');
      return false;
    }
  };

  const deleteTeamMember = async (memberId: string) => {
    try {
      await azureApi.put(`/db/fri_lessor_team_members`, { id: memberId, is_active: false });

      toast.success('Teammedlem slettet');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Kunne ikke slette teammedlem');
      return false;
    }
  };

  const createVehicle = async (vehicle: { make: string; model: string; year: number; license_plate: string; daily_rate: number }) => {
    if (!lessorId) {
      toast.error('Lessor ID ikke fundet');
      return null;
    }

    try {
      await azureApi.post(`/db/fri_vehicles`, {
        records: [
          {
            lessor_id: lessorId,
            ...vehicle,
            status: 'available',
          },
        ],
      });

      toast.success('Køretøj oprettet');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      toast.error('Kunne ikke oprette køretøj');
      return null;
    }
  };

  const updateVehicle = async (vehicleId: string, updates: Partial<FriVehicle>) => {
    try {
      await azureApi.put(`/db/fri_vehicles`, { id: vehicleId, ...updates });

      toast.success('Køretøj opdateret');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      toast.error('Kunne ikke opdatere køretøj');
      return false;
    }
  };

  const createBooking = async (booking: { vehicle_id: string; renter_name: string; renter_email: string; renter_phone?: string; start_date: string; end_date: string; daily_rate: number; additional_fees?: number }) => {
    if (!lessorId) {
      toast.error('Lessor ID ikke fundet');
      return null;
    }

    try {
      const escapeSqlValue = (value: string) => value.replace(/'/g, "''");
      const safeLessorId = escapeSqlValue(lessorId);
      const safeVehicleId = escapeSqlValue(booking.vehicle_id);
      const safeName = escapeSqlValue(booking.renter_name);
      const safeEmail = escapeSqlValue(booking.renter_email);
      const safePhone = escapeSqlValue(booking.renter_phone || '');
      const safeStart = escapeSqlValue(booking.start_date);
      const safeEnd = escapeSqlValue(booking.end_date);

      const query = `
DECLARE @customer_id UNIQUEIDENTIFIER;
SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeEmail}';
IF @customer_id IS NULL
BEGIN
  INSERT INTO fri_customers (id, lessor_id, full_name, email, phone, is_verified, created_at, updated_at)
  VALUES (NEWID(), '${safeLessorId}', '${safeName}', '${safeEmail}', ${booking.renter_phone ? `'${safePhone}'` : 'NULL'}, 0, GETUTCDATE(), GETUTCDATE());
  SELECT @customer_id = id FROM fri_customers WHERE lessor_id='${safeLessorId}' AND email='${safeEmail}';
END

DECLARE @pickup_date DATETIME2 = '${safeStart}';
DECLARE @return_date DATETIME2 = '${safeEnd}';
DECLARE @days INT = CASE WHEN ABS(DATEDIFF(day, @pickup_date, @return_date)) < 1 THEN 1 ELSE ABS(DATEDIFF(day, @pickup_date, @return_date)) END;
DECLARE @base_price DECIMAL(10,2) = ${booking.daily_rate} * @days;
DECLARE @additional_fees DECIMAL(10,2) = ${booking.additional_fees ?? 0};
DECLARE @total_price DECIMAL(10,2) = @base_price + @additional_fees;

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
  created_at,
  updated_at
) VALUES (
  '${safeLessorId}',
  '${safeVehicleId}',
  @customer_id,
  @pickup_date,
  @return_date,
  @days,
  ${booking.daily_rate},
  @base_price,
  @additional_fees,
  @total_price,
  'pending',
  GETUTCDATE(),
  GETUTCDATE()
);
`;

      await azureApi.post('/db/query', { query });

      toast.success('Booking oprettet');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('Kunne ikke oprette booking');
      return null;
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: FriBooking['status']) => {
    try {
      await azureApi.put(`/db/fri_bookings`, { id: bookingId, status: newStatus });

      toast.success('Booking status opdateret');
      await fetchFriData();
      return true;
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Kunne ikke opdatere booking');
      return false;
    }
  };

  const getVehicleUtilization = () => {
    if (vehicles.length === 0) return 0;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentBookings = bookings.filter((b) => new Date(b.created_at) >= thirtyDaysAgo);
    const vehiclesUsed = new Set(recentBookings.map((b) => b.vehicle_id)).size;

    return Math.round((vehiclesUsed / vehicles.length) * 100);
  };

  const getTotalMonthlyRevenue = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return bookings
      .filter((b) => {
        const bookDate = new Date(b.created_at);
        return bookDate >= monthStart && bookDate <= monthEnd && b.status === 'completed';
      })
      .reduce((sum, b) => sum + b.total_price, 0);
  };

  const getVehicleRevenue = (vehicleId: string) => {
    return bookings
      .filter((b) => b.vehicle_id === vehicleId && b.status === 'completed')
      .reduce((sum, b) => sum + b.total_price, 0);
  };

  return {
    friLessor,
    teamMembers,
    vehicles,
    bookings,
    invoices,
    isLoading,
    createTeamMember,
    updateTeamMember,
    deleteTeamMember,
    createVehicle,
    updateVehicle,
    createBooking,
    updateBookingStatus,
    getVehicleUtilization,
    getTotalMonthlyRevenue,
    getVehicleRevenue,
    refetch: fetchFriData,
  };
};
