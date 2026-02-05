import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ServiceBooking {
  id: string;
  vehicle_id: string;
  lessor_id: string;
  service_reminder_id: string | null;
  service_type: string;
  preferred_date: string;
  preferred_time_slot: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  workshop_notes: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  completed_at: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string;
    model: string;
  };
}

const SERVICE_TYPES = [
  { value: 'oil_change', label: 'Olieskift', estimated: 800 },
  { value: 'brakes', label: 'Bremser', estimated: 2500 },
  { value: 'tires', label: 'Dækskift', estimated: 400 },
  { value: 'inspection', label: 'Syn', estimated: 600 },
  { value: 'full_service', label: 'Fuld service', estimated: 3500 },
  { value: 'other', label: 'Andet', estimated: 0 },
];

export const useServiceBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!user) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          vehicle:vehicles(registration, make, model)
        `)
        .eq('lessor_id', user.id)
        .order('preferred_date', { ascending: true });

      if (error) throw error;
      setBookings((data || []) as ServiceBooking[]);
    } catch (err) {
      console.error('Error fetching service bookings:', err);
      toast.error('Kunne ikke hente værkstedsbookinger');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const createBooking = async (booking: {
    vehicle_id: string;
    service_reminder_id?: string;
    service_type: string;
    preferred_date: string;
    preferred_time_slot?: string;
  }) => {
    if (!user) return null;

    try {
      const serviceType = SERVICE_TYPES.find(s => s.value === booking.service_type);

      const { data, error } = await supabase
        .from('service_bookings')
        .insert({
          vehicle_id: booking.vehicle_id,
          lessor_id: user.id,
          service_reminder_id: booking.service_reminder_id || null,
          service_type: booking.service_type,
          preferred_date: booking.preferred_date,
          preferred_time_slot: booking.preferred_time_slot || null,
          estimated_cost: serviceType?.estimated || null,
        })
        .select(`
          *,
          vehicle:vehicles(registration, make, model)
        `)
        .single();

      if (error) throw error;

      setBookings(prev => [...prev, data as ServiceBooking]);
      toast.success('Værkstedstid booket hos LEJIO');
      return data;
    } catch (err) {
      console.error('Error creating service booking:', err);
      toast.error('Kunne ikke booke værkstedstid');
      return null;
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('service_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
      ));

      toast.success('Booking annulleret');
    } catch (err) {
      console.error('Error cancelling service booking:', err);
      toast.error('Kunne ikke annullere booking');
    }
  };

  const getUpcomingBookings = () => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(b => 
      b.preferred_date >= today && 
      b.status !== 'cancelled' && 
      b.status !== 'completed'
    );
  };

  return {
    bookings,
    isLoading,
    createBooking,
    cancelBooking,
    getUpcomingBookings,
    serviceTypes: SERVICE_TYPES,
    refetch: fetchBookings,
  };
};
