import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Booking {
  id: string;
  vehicle_id: string;
  renter_id: string | null;
  lessor_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  renter_name: string | null;
  renter_email: string | null;
  renter_phone: string | null;
  renter_license_number: string | null;
  notes: string | null;
  payment_method: string | null;
  payment_received: boolean;
  payment_received_at: string | null;
  deposit_amount: number | null;
  included_km: number | null;
  extra_km_price: number | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    registration: string;
    make: string;
    model: string;
    exterior_cleaning_fee?: number;
    interior_cleaning_fee?: number;
  };
}

export interface UpdateStatusResult {
  success: boolean;
  booking?: Booking;
}

export const useBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) {
      setBookings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          vehicle:vehicles(registration, make, model, exterior_cleaning_fee, interior_cleaning_fee)
        `)
        .eq('lessor_id', user.id)
        .order('start_date', { ascending: false });

      if (fetchError) throw fetchError;
      // Cast the status field to the correct type
      const typedData = (data || []).map(booking => ({
        ...booking,
        status: booking.status as Booking['status'],
      }));
      setBookings(typedData);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Kunne ikke hente bookinger');
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookingStatus = async (id: string, status: Booking['status']): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);

      if (updateError) throw updateError;

      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status === 'confirmed' ? 'bekræftet' : status === 'cancelled' ? 'annulleret' : 'opdateret'}`);
      return true;
    } catch (err) {
      console.error('Error updating booking:', err);
      toast.error('Kunne ikke opdatere booking');
      return false;
    }
  };

  const markPaymentReceived = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          payment_received: true,
          payment_received_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setBookings(prev => prev.map(b => 
        b.id === id 
          ? { ...b, payment_received: true, payment_received_at: new Date().toISOString() } 
          : b
      ));

      // Opret faktura asynkront, men fail ikke payment marking hvis det mislykkes
      try {
        await supabase.functions.invoke('generate-invoice', {
          body: { bookingId: id }
        });
      } catch (invoiceError) {
        console.error('Fejl ved fakturering:', invoiceError);
        // Don't fail payment marking if invoice generation fails
      }

      // Send booking paid confirmation email to renter
      try {
        await supabase.functions.invoke('send-booking-paid-confirmation', {
          body: { bookingId: id }
        });
        console.log('Booking paid confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send booking paid email:', emailError);
        // Don't fail the payment marking if email fails
      }

      toast.success('Betaling markeret som modtaget');
      return true;
    } catch (err) {
      console.error('Error marking payment received:', err);
      toast.error('Kunne ikke opdatere betalingsstatus');
      return false;
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  return {
    bookings,
    isLoading,
    error,
    updateBookingStatus,
    markPaymentReceived,
    refetch: fetchBookings,
  };
};
