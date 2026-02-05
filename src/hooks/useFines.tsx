import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Fine {
  id: string;
  lessor_id: string;
  booking_id: string | null;
  vehicle_id: string | null;
  renter_email: string;
  renter_name: string | null;
  fine_type: 'parking' | 'speed' | 'toll' | 'other';
  fine_date: string;
  fine_amount: number;
  admin_fee: number;
  total_amount: number;
  file_url: string | null;
  description: string | null;
  status: 'pending' | 'sent_to_renter' | 'paid' | 'disputed';
  sent_to_renter_at: string | null;
  paid_at: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string;
    model: string;
  };
  booking?: {
    start_date: string;
    end_date: string;
  };
}

export const useFines = () => {
  const { user, profile } = useAuth();
  const [fines, setFines] = useState<Fine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFines = useCallback(async () => {
    if (!user) {
      setFines([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fines')
        .select(`
          *,
          vehicle:vehicles(registration, make, model),
          booking:bookings(start_date, end_date)
        `)
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFines((data || []) as Fine[]);
    } catch (err) {
      console.error('Error fetching fines:', err);
      toast.error('Kunne ikke hente bøder');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFines();
  }, [fetchFines]);

  const addFine = async (fine: {
    vehicle_id?: string;
    renter_email: string;
    renter_name?: string;
    fine_type: Fine['fine_type'];
    fine_date: string;
    fine_amount: number;
    description?: string;
    file_url?: string;
  }) => {
    if (!user) return null;

    try {
      // Get custom admin fee from profile or use default
      const adminFee = (profile)?.fine_admin_fee || 500;

      // Try to auto-match with a booking
      let matchedBooking = null;
      if (fine.vehicle_id) {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, renter_email, renter_name')
          .eq('vehicle_id', fine.vehicle_id)
          .lte('start_date', fine.fine_date)
          .gte('end_date', fine.fine_date)
          .limit(1);

        if (bookings && bookings.length > 0) {
          matchedBooking = bookings[0];
        }
      }

      const { data, error } = await supabase
        .from('fines')
        .insert({
          lessor_id: user.id,
          vehicle_id: fine.vehicle_id || null,
          booking_id: matchedBooking?.id || null,
          renter_email: matchedBooking?.renter_email || fine.renter_email,
          renter_name: matchedBooking?.renter_name || fine.renter_name || null,
          fine_type: fine.fine_type,
          fine_date: fine.fine_date,
          fine_amount: fine.fine_amount,
          admin_fee: adminFee,
          description: fine.description || null,
          file_url: fine.file_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      setFines(prev => [data as Fine, ...prev]);
      toast.success(matchedBooking ? 'Bøde tilføjet og matchet med booking' : 'Bøde tilføjet');
      return data;
    } catch (err) {
      console.error('Error adding fine:', err);
      toast.error('Kunne ikke tilføje bøde');
      return null;
    }
  };

  const sendToRenter = async (fineId: string) => {
    try {
      const fine = fines.find(f => f.id === fineId);
      if (!fine) throw new Error('Bøde ikke fundet');

      // Get lessor name
      const lessorName = (profile)?.full_name || (profile)?.company_name || 'Udlejer';

      // Send email notification
      await supabase.functions.invoke('send-fine-notification', {
        body: {
          renterEmail: fine.renter_email,
          renterName: fine.renter_name || 'Lejer',
          lessorName,
          fineType: fine.fine_type,
          fineDate: fine.fine_date,
          fineAmount: fine.fine_amount,
          adminFee: fine.admin_fee,
          totalAmount: fine.total_amount,
          description: fine.description,
          fileUrl: fine.file_url,
          vehicleInfo: fine.vehicle ? `${fine.vehicle.registration} (${fine.vehicle.make} ${fine.vehicle.model})` : undefined,
        },
      });

      // Update status
      const { error } = await supabase
        .from('fines')
        .update({
          status: 'sent_to_renter',
          sent_to_renter_at: new Date().toISOString(),
        })
        .eq('id', fineId);

      if (error) throw error;

      setFines(prev => prev.map(f => 
        f.id === fineId 
          ? { ...f, status: 'sent_to_renter' as const, sent_to_renter_at: new Date().toISOString() }
          : f
      ));

      toast.success(`Bøde sendt til ${fine.renter_email}`);
    } catch (err) {
      console.error('Error sending fine:', err);
      toast.error('Kunne ikke sende bøde');
    }
  };

  const markAsPaid = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('fines')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', fineId);

      if (error) throw error;

      setFines(prev => prev.map(f => 
        f.id === fineId 
          ? { ...f, status: 'paid' as const, paid_at: new Date().toISOString() }
          : f
      ));

      toast.success('Bøde markeret som betalt');
    } catch (err) {
      console.error('Error marking fine as paid:', err);
      toast.error('Kunne ikke opdatere bøde');
    }
  };

  const deleteFine = async (fineId: string) => {
    try {
      const { error } = await supabase
        .from('fines')
        .delete()
        .eq('id', fineId);

      if (error) throw error;

      setFines(prev => prev.filter(f => f.id !== fineId));
      toast.success('Bøde slettet');
    } catch (err) {
      console.error('Error deleting fine:', err);
      toast.error('Kunne ikke slette bøde');
    }
  };

  return {
    fines,
    isLoading,
    addFine,
    sendToRenter,
    markAsPaid,
    deleteFine,
    refetch: fetchFines,
  };
};
