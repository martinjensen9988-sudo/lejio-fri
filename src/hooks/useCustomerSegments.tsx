import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface CustomerSegment {
  id: string;
  lessor_id: string;
  renter_email: string;
  renter_name: string | null;
  segment: string;
  total_bookings: number;
  total_revenue: number;
  first_booking_at: string | null;
  last_booking_at: string | null;
  notes: string | null;
}

export const useCustomerSegments = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<CustomerSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('lessor_id', user.id)
        .order('total_revenue', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customer segments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const updateSegment = async (id: string, segment: string) => {
    try {
      const { error } = await supabase
        .from('customer_segments')
        .update({ segment })
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.map(c => c.id === id ? { ...c, segment } : c));
      toast.success('Kundesegment opdateret');
      return true;
    } catch (error) {
      console.error('Error updating segment:', error);
      toast.error('Kunne ikke opdatere segment');
      return false;
    }
  };

  const addNote = async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('customer_segments')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.map(c => c.id === id ? { ...c, notes } : c));
      toast.success('Note gemt');
      return true;
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Kunne ikke gemme note');
      return false;
    }
  };

  // Sync customer data from bookings
  const syncFromBookings = async () => {
    if (!user) return;

    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('renter_email, renter_name, total_price, created_at')
        .eq('lessor_id', user.id)
        .eq('status', 'completed');

      if (error) throw error;

      // Group by email
      const customerMap = new Map<string, {
        renter_name: string | null;
        total_bookings: number;
        total_revenue: number;
        first_booking_at: string;
        last_booking_at: string;
      }>();

      bookings?.forEach(booking => {
        if (!booking.renter_email) return;
        
        const existing = customerMap.get(booking.renter_email);
        if (existing) {
          existing.total_bookings++;
          existing.total_revenue += booking.total_price || 0;
          if (booking.created_at < existing.first_booking_at) {
            existing.first_booking_at = booking.created_at;
          }
          if (booking.created_at > existing.last_booking_at) {
            existing.last_booking_at = booking.created_at;
          }
        } else {
          customerMap.set(booking.renter_email, {
            renter_name: booking.renter_name,
            total_bookings: 1,
            total_revenue: booking.total_price || 0,
            first_booking_at: booking.created_at,
            last_booking_at: booking.created_at,
          });
        }
      });

      // Upsert customer segments
      for (const [email, data] of customerMap) {
        const segment = data.total_bookings >= 10 ? 'vip' 
          : data.total_bookings >= 5 ? 'loyal' 
          : data.total_bookings >= 2 ? 'returning' 
          : 'standard';

        await supabase
          .from('customer_segments')
          .upsert({
            lessor_id: user.id,
            renter_email: email,
            renter_name: data.renter_name,
            segment,
            total_bookings: data.total_bookings,
            total_revenue: data.total_revenue,
            first_booking_at: data.first_booking_at,
            last_booking_at: data.last_booking_at,
          }, {
            onConflict: 'lessor_id,renter_email',
          });
      }

      await fetchCustomers();
      toast.success('Kundedata synkroniseret');
    } catch (error) {
      console.error('Error syncing customers:', error);
      toast.error('Kunne ikke synkronisere kundedata');
    }
  };

  const getVipCustomers = () => customers.filter(c => c.segment === 'vip');
  const getLoyalCustomers = () => customers.filter(c => c.segment === 'loyal');
  const getReturningCustomers = () => customers.filter(c => c.segment === 'returning');

  return {
    customers,
    isLoading,
    updateSegment,
    addNote,
    syncFromBookings,
    getVipCustomers,
    getLoyalCustomers,
    getReturningCustomers,
    refetch: fetchCustomers,
  };
};
