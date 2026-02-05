import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RevenueLossCalculation {
  id: string;
  damage_report_id: string | null;
  booking_id: string | null;
  vehicle_id: string;
  lessor_id: string;
  calculation_date: string;
  daily_rate_average: number;
  days_out_of_service: number;
  total_revenue_loss: number;
  historical_utilization_rate: number | null;
  ai_estimated_bookings: number | null;
  repair_start_date: string | null;
  repair_end_date: string | null;
  status: string;
  claim_submitted_at: string | null;
  claim_approved_at: string | null;
  notes: string | null;
  created_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration_number: string;
  };
  damage_report?: {
    report_type: string;
    created_at: string;
  };
}

export const useRevenueLoss = (vehicleId?: string) => {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<RevenueLossCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);

  const fetchCalculations = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('revenue_loss_calculations')
        .select('*')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCalculations((data || []) as unknown as RevenueLossCalculation[]);
    } catch (err) {
      console.error('Error fetching revenue loss calculations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, vehicleId]);

  const calculateRevenueLoss = async (
    vehicleId: string,
    damageReportId?: string,
    bookingId?: string,
    repairStartDate?: string,
    repairEndDate?: string
  ): Promise<RevenueLossCalculation | null> => {
    if (!user) return null;
    setIsCalculating(true);

    try {
      // Get vehicle's historical booking data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('total_price, start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .eq('status', 'completed')
        .order('end_date', { ascending: false })
        .limit(20);

      if (bookingsError) throw bookingsError;

      // Calculate average daily rate
      let totalDays = 0;
      let totalRevenue = 0;

      bookings?.forEach(booking => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        totalDays += days;
        totalRevenue += booking.total_price;
      });

      const avgDailyRate = totalDays > 0 ? totalRevenue / totalDays : 500; // Default to 500 if no history

      // Calculate utilization rate (last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .gte('start_date', ninetyDaysAgo.toISOString())
        .in('status', ['completed', 'confirmed', 'active']);

      let bookedDays = 0;
      recentBookings?.forEach(booking => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        bookedDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });

      const utilizationRate = (bookedDays / 90) * 100;

      // Calculate days out of service
      const startDate = repairStartDate ? new Date(repairStartDate) : new Date();
      const endDate = repairEndDate ? new Date(repairEndDate) : new Date();
      endDate.setDate(endDate.getDate() + 14); // Default 14 days if no end date

      const daysOut = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate estimated lost bookings based on utilization
      const estimatedBookings = Math.round((utilizationRate / 100) * (daysOut / 3)); // Avg 3-day bookings

      // Calculate total loss
      const totalLoss = avgDailyRate * daysOut * (utilizationRate / 100);

      // Insert calculation
      const { data, error } = await supabase
        .from('revenue_loss_calculations')
        .insert({
          damage_report_id: damageReportId,
          booking_id: bookingId,
          vehicle_id: vehicleId,
          lessor_id: user.id,
          daily_rate_average: Math.round(avgDailyRate * 100) / 100,
          days_out_of_service: daysOut,
          total_revenue_loss: Math.round(totalLoss * 100) / 100,
          historical_utilization_rate: Math.round(utilizationRate * 100) / 100,
          ai_estimated_bookings: estimatedBookings,
          repair_start_date: repairStartDate || startDate.toISOString().split('T')[0],
          repair_end_date: repairEndDate || endDate.toISOString().split('T')[0],
          status: 'calculated'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success(`Tab af indtægt beregnet: ${Math.round(totalLoss).toLocaleString('da-DK')} kr`);
      await fetchCalculations();
      return data as unknown as RevenueLossCalculation;
    } catch (err) {
      console.error('Error calculating revenue loss:', err);
      toast.error('Kunne ikke beregne tab af indtægt');
      return null;
    } finally {
      setIsCalculating(false);
    }
  };

  const submitClaim = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('revenue_loss_calculations')
        .update({
          status: 'claimed',
          claim_submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCalculations(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'claimed', claim_submitted_at: new Date().toISOString() } : c
      ));
      toast.success('Krav indsendt');
      return true;
    } catch (err) {
      console.error('Error submitting claim:', err);
      toast.error('Kunne ikke indsende krav');
      return false;
    }
  };

  const updateCalculation = async (id: string, updates: Partial<RevenueLossCalculation>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('revenue_loss_calculations')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setCalculations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast.success('Beregning opdateret');
      return true;
    } catch (err) {
      console.error('Error updating calculation:', err);
      toast.error('Kunne ikke opdatere beregning');
      return false;
    }
  };

  useEffect(() => {
    fetchCalculations();
  }, [fetchCalculations]);

  return {
    calculations,
    isLoading,
    isCalculating,
    calculateRevenueLoss,
    submitClaim,
    updateCalculation,
    refetch: fetchCalculations
  };
};
