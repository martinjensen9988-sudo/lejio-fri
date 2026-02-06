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
  role: 'manager' | 'salesperson' | 'driver' | 'mechanic' | 'accountant';
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

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export const useFriLessor = () => {
  const auth = useFriAuth();
  const lessorId = auth.user?.lessor_id;
  const [friLessor, setFriLessor] = useState<FriLessor | null>(null);
  const [teamMembers, setTeamMembers] = useState<FriTeamMember[]>([]);
  const [vehicles, setVehicles] = useState<FriVehicle[]>([]);
  const [bookings, setBookings] = useState<FriBooking[]>([]);
  const [invoices, setInvoices] = useState<FriInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriData = useCallback(async () => {
    if (!lessorId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const safeLessorId = esc(lessorId);
      const [lessorRes, teamRes, vehiclesRes, bookingsRes, invoicesRes] = await Promise.allSettled([
        azureApi.post<any>('/db-query', {
          query: `SELECT id, company_name, email AS contact_email, subscription_status AS status, created_at FROM fri_lessors WHERE id='${safeLessorId}'`
        }),
        azureApi.post<any>('/db-query', {
          query: `SELECT *, name AS full_name FROM fri_lessor_team_members WHERE lessor_id='${safeLessorId}' AND status='active'`
        }),
        azureApi.post<any>('/db-query', {
          query: `SELECT *, availability_status AS status FROM fri_vehicles WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC`
        }),
        azureApi.post<any>('/db-query', {
          query: `SELECT b.*, b.customer_name AS renter_name, b.email AS renter_email, b.phone AS renter_phone
                  FROM fri_bookings b WHERE b.lessor_id='${safeLessorId}'
                  ORDER BY b.created_at DESC LIMIT 100`
        }),
        azureApi.post<any>('/db-query', {
          query: `SELECT *, created_at AS issued_date FROM fri_invoices WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC`
        }),
      ]);

      const lessorRows = lessorRes.status === 'fulfilled' ? normalizeRows(lessorRes.value) : [];
      const teamRows = teamRes.status === 'fulfilled' ? normalizeRows(teamRes.value) : [];
      const vehicleRows = vehiclesRes.status === 'fulfilled' ? normalizeRows(vehiclesRes.value) : [];
      const bookingRows = bookingsRes.status === 'fulfilled' ? normalizeRows(bookingsRes.value) : [];
      const invoiceRows = invoicesRes.status === 'fulfilled' ? normalizeRows(invoicesRes.value) : [];

      if (lessorRows?.[0]) setFriLessor(lessorRows[0] as FriLessor);
      setTeamMembers((teamRows || []) as FriTeamMember[]);
      setVehicles((vehicleRows || []) as FriVehicle[]);
      setBookings((bookingRows || []) as FriBooking[]);
      setInvoices((invoiceRows || []) as FriInvoice[]);
    } catch (error) {
      console.error('Error fetching Fri data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lessorId]);

  useEffect(() => { fetchFriData(); }, [fetchFriData]);

  const createTeamMember = async (member: { full_name: string; email: string; phone?: string; role: 'manager' | 'driver' | 'mechanic' | 'accountant' }) => {
    if (!lessorId) { toast.error('Lessor ID ikke fundet'); return null; }
    try {
      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_lessor_team_members (lessor_id, name, email, role, status) VALUES ('${esc(lessorId)}', '${esc(member.full_name)}', '${esc(member.email)}', '${esc(member.role)}', 'active')`,
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
      const setClauses: string[] = [];
      if (updates.full_name) setClauses.push(`name='${esc(updates.full_name)}'`);
      if (updates.email) setClauses.push(`email='${esc(updates.email)}'`);
      if (updates.role) setClauses.push(`role='${esc(updates.role)}'`);
      if (setClauses.length === 0) return true;
      await azureApi.post('/db-query', {
        query: `UPDATE fri_lessor_team_members SET ${setClauses.join(', ')} WHERE id='${esc(memberId)}'`,
      });
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
      await azureApi.post('/db-query', {
        query: `DELETE FROM fri_lessor_team_members WHERE id='${esc(memberId)}'`,
      });
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
    if (!lessorId) { toast.error('Lessor ID ikke fundet'); return null; }
    try {
      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, daily_rate, availability_status, is_active)
                VALUES ('${esc(lessorId)}', '${esc(vehicle.make)}', '${esc(vehicle.model)}', ${vehicle.year}, '${esc(vehicle.license_plate)}', ${vehicle.daily_rate}, 'available', TRUE)`,
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
      const setClauses: string[] = [];
      if (updates.make) setClauses.push(`make='${esc(updates.make)}'`);
      if (updates.model) setClauses.push(`model='${esc(updates.model)}'`);
      if (updates.year) setClauses.push(`year=${updates.year}`);
      if (updates.license_plate) setClauses.push(`license_plate='${esc(updates.license_plate)}'`);
      if (updates.daily_rate !== undefined) setClauses.push(`daily_rate=${updates.daily_rate}`);
      if (updates.status) setClauses.push(`availability_status='${esc(updates.status)}'`);
      if (setClauses.length === 0) return true;
      setClauses.push(`updated_at=NOW()`);
      await azureApi.post('/db-query', {
        query: `UPDATE fri_vehicles SET ${setClauses.join(', ')} WHERE id='${esc(vehicleId)}'`,
      });
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
    if (!lessorId) { toast.error('Lessor ID ikke fundet'); return null; }
    try {
      const start = new Date(booking.start_date);
      const end = new Date(booking.end_date);
      const days = Math.max(1, Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      const total = booking.daily_rate * days + (booking.additional_fees ?? 0);
      const phoneVal = booking.renter_phone ? `'${esc(booking.renter_phone)}'` : 'NULL';

      await azureApi.post('/db-query', {
        query: `INSERT INTO fri_bookings (lessor_id, vehicle_id, customer_name, email, phone, start_date, end_date, rental_days, daily_rate, total_price, status)
                VALUES ('${esc(lessorId)}', '${esc(booking.vehicle_id)}', '${esc(booking.renter_name)}', '${esc(booking.renter_email)}', ${phoneVal}, '${esc(booking.start_date)}', '${esc(booking.end_date)}', ${days}, ${booking.daily_rate}, ${total}, 'pending')`,
      });
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
      await azureApi.post('/db-query', {
        query: `UPDATE fri_bookings SET status='${esc(newStatus)}', updated_at=NOW() WHERE id='${esc(bookingId)}'`,
      });
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
    const recentBookings = bookings.filter(b => new Date(b.created_at) >= thirtyDaysAgo);
    const vehiclesUsed = new Set(recentBookings.map(b => b.vehicle_id)).size;
    return Math.round((vehiclesUsed / vehicles.length) * 100);
  };

  const getTotalMonthlyRevenue = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return bookings
      .filter(b => {
        const d = new Date(b.created_at);
        return d >= monthStart && d <= monthEnd && b.status === 'completed';
      })
      .reduce((sum, b) => sum + b.total_price, 0);
  };

  const getVehicleRevenue = (vehicleId: string) => {
    return bookings.filter(b => b.vehicle_id === vehicleId && b.status === 'completed').reduce((sum, b) => sum + b.total_price, 0);
  };

  return {
    friLessor, teamMembers, vehicles, bookings, invoices, isLoading,
    createTeamMember, updateTeamMember, deleteTeamMember,
    createVehicle, updateVehicle,
    createBooking, updateBookingStatus,
    getVehicleUtilization, getTotalMonthlyRevenue, getVehicleRevenue,
    refetch: fetchFriData,
  };
};
