import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { eachDayOfInterval, parseISO, isWithinInterval, startOfDay } from 'date-fns';

interface BookedPeriod {
  start_date: string;
  end_date: string;
}

export const useVehicleBookedDates = (vehicleId: string | null | undefined) => {
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [bookedPeriods, setBookedPeriods] = useState<BookedPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBookedDates = useCallback(async () => {
    if (!vehicleId) {
      setBookedDates([]);
      setBookedPeriods([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicleId)
        .in('status', ['pending', 'confirmed', 'active']);

      if (error) throw error;

      const periods: BookedPeriod[] = data || [];
      setBookedPeriods(periods);

      // Generate all booked dates
      const allBookedDates: Date[] = [];
      periods.forEach(period => {
        const start = parseISO(period.start_date);
        const end = parseISO(period.end_date);
        const datesInRange = eachDayOfInterval({ start, end });
        allBookedDates.push(...datesInRange);
      });

      setBookedDates(allBookedDates);
    } catch (error) {
      console.error('Error fetching booked dates:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchBookedDates();
  }, [fetchBookedDates]);

  // Function to check if a specific date is booked
  const isDateBooked = useCallback((date: Date): boolean => {
    const normalizedDate = startOfDay(date);
    return bookedDates.some(bookedDate => 
      startOfDay(bookedDate).getTime() === normalizedDate.getTime()
    );
  }, [bookedDates]);

  // Function to check if a date range overlaps with unknown booked period
  const isRangeOverlapping = useCallback((startDate: Date, endDate: Date): boolean => {
    return bookedPeriods.some(period => {
      const periodStart = parseISO(period.start_date);
      const periodEnd = parseISO(period.end_date);
      
      // Check if ranges overlap
      return startDate <= periodEnd && endDate >= periodStart;
    });
  }, [bookedPeriods]);

  // Matcher function for react-day-picker disabled prop
  const disabledMatcher = useCallback((date: Date): boolean => {
    // Disable past dates
    if (date < startOfDay(new Date())) return true;
    // Disable booked dates
    return isDateBooked(date);
  }, [isDateBooked]);

  return {
    bookedDates,
    bookedPeriods,
    isLoading,
    isDateBooked,
    isRangeOverlapping,
    disabledMatcher,
    refetch: fetchBookedDates,
  };
};
