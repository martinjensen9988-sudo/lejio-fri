import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { addMonths, format } from 'date-fns';

export interface RecurringRental {
  id: string;
  booking_id: string;
  vehicle_id: string;
  lessor_id: string;
  renter_id: string | null;
  renter_email: string;
  renter_name: string | null;
  renter_phone: string | null;
  monthly_price: number;
  deposit_amount: number;
  included_km: number;
  extra_km_price: number;
  billing_day: number;
  next_billing_date: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  started_at: string;
  paused_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  total_renewals: number;
  last_renewal_at: string | null;
  created_at: string;
  vehicle?: {
    registration: string;
    make: string;
    model: string;
  };
}

export interface CreateRecurringRentalInput {
  booking_id: string;
  vehicle_id: string;
  renter_email: string;
  renter_name?: string;
  renter_phone?: string;
  monthly_price: number;
  deposit_amount?: number;
  included_km?: number;
  extra_km_price?: number;
  billing_day?: number;
}

export const useRecurringRentals = () => {
  const { user } = useAuth();
  const [recurringRentals, setRecurringRentals] = useState<RecurringRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecurringRentals = useCallback(async () => {
    if (!user) {
      setRecurringRentals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recurring_rentals')
        .select(`
          *,
          vehicle:vehicles(registration, make, model)
        `)
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecurringRentals((data || []) as RecurringRental[]);
    } catch (err) {
      console.error('Error fetching recurring rentals:', err);
      toast.error('Kunne ikke hente gentagne lejeaftaler');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createRecurringRental = async (input: CreateRecurringRentalInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const nextBillingDate = new Date();
      nextBillingDate.setDate(input.billing_day || 1);
      if (nextBillingDate <= new Date()) {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      }

      const { error } = await supabase
        .from('recurring_rentals')
        .insert({
          booking_id: input.booking_id,
          vehicle_id: input.vehicle_id,
          lessor_id: user.id,
          renter_email: input.renter_email,
          renter_name: input.renter_name,
          renter_phone: input.renter_phone,
          monthly_price: input.monthly_price,
          deposit_amount: input.deposit_amount || 0,
          included_km: input.included_km || 100,
          extra_km_price: input.extra_km_price || 2.5,
          billing_day: input.billing_day || 1,
          next_billing_date: format(nextBillingDate, 'yyyy-MM-dd'),
        });

      if (error) throw error;

      toast.success('Gentagen lejeaftale oprettet');
      await fetchRecurringRentals();
      return true;
    } catch (err) {
      console.error('Error creating recurring rental:', err);
      toast.error('Kunne ikke oprette gentagen lejeaftale');
      return false;
    }
  };

  const updateRecurringRental = async (
    id: string, 
    updates: Partial<Pick<RecurringRental, 'monthly_price' | 'billing_day' | 'included_km' | 'extra_km_price'>>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_rentals')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setRecurringRentals(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success('Lejeaftale opdateret');
      return true;
    } catch (err) {
      console.error('Error updating recurring rental:', err);
      toast.error('Kunne ikke opdatere lejeaftale');
      return false;
    }
  };

  const pauseRecurringRental = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_rentals')
        .update({ 
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setRecurringRentals(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'paused' as const, paused_at: new Date().toISOString() } : r
      ));
      toast.success('Lejeaftale sat på pause');
      return true;
    } catch (err) {
      console.error('Error pausing recurring rental:', err);
      toast.error('Kunne ikke pause lejeaftale');
      return false;
    }
  };

  const resumeRecurringRental = async (id: string): Promise<boolean> => {
    try {
      const nextBillingDate = addMonths(new Date(), 1);
      
      const { error } = await supabase
        .from('recurring_rentals')
        .update({ 
          status: 'active',
          paused_at: null,
          next_billing_date: format(nextBillingDate, 'yyyy-MM-dd')
        })
        .eq('id', id);

      if (error) throw error;

      setRecurringRentals(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'active' as const, paused_at: null } : r
      ));
      toast.success('Lejeaftale genoptaget');
      return true;
    } catch (err) {
      console.error('Error resuming recurring rental:', err);
      toast.error('Kunne ikke genoptage lejeaftale');
      return false;
    }
  };

  const cancelRecurringRental = async (id: string, reason?: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('recurring_rentals')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason || null
        })
        .eq('id', id);

      if (error) throw error;

      setRecurringRentals(prev => prev.map(r => 
        r.id === id ? { ...r, status: 'cancelled' as const, cancelled_at: new Date().toISOString() } : r
      ));
      toast.success('Lejeaftale annulleret');
      return true;
    } catch (err) {
      console.error('Error cancelling recurring rental:', err);
      toast.error('Kunne ikke annullere lejeaftale');
      return false;
    }
  };

  useEffect(() => {
    fetchRecurringRentals();
  }, [fetchRecurringRentals]);

  return {
    recurringRentals,
    isLoading,
    createRecurringRental,
    updateRecurringRental,
    pauseRecurringRental,
    resumeRecurringRental,
    cancelRecurringRental,
    refetch: fetchRecurringRentals,
  };
};
