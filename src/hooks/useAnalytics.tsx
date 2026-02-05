import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';

export interface MonthlyStats {
  month: string;
  revenue: number;
  bookings: number;
  avgBookingValue: number;
}

export interface VehicleStats {
  vehicleId: string;
  registration: string;
  make: string;
  model: string;
  revenue: number;
  bookings: number;
  utilizationDays: number;
  utilizationRate: number;
}

export interface AnalyticsSummary {
  totalRevenue: number;
  totalBookings: number;
  avgBookingValue: number;
  completedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  activeRecurringRentals: number;
  revenueGrowth: number;
  bookingsGrowth: number;
}

export const useAnalytics = (monthsBack: number = 6) => {
  const { user } = useAuth();
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const now = new Date();
      const startDate = startOfMonth(subMonths(now, monthsBack));

      // Fetch all bookings for the period
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          id,
          total_price,
          status,
          start_date,
          end_date,
          vehicle_id,
          vehicle:vehicles(id, registration, make, model)
        `)
        .eq('lessor_id', user.id)
        .gte('created_at', startDate.toISOString());

      if (bookingsError) throw bookingsError;

      // Fetch recurring rentals count
      const { count: recurringCount } = await supabase
        .from('recurring_rentals')
        .select('id', { count: 'exact', head: true })
        .eq('lessor_id', user.id)
        .eq('status', 'active');

      // Calculate monthly stats
      const monthlyData: Record<string, { revenue: number; bookings: number }> = {};
      for (let i = 0; i < monthsBack; i++) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, 'yyyy-MM');
        monthlyData[key] = { revenue: 0, bookings: 0 };
      }

      // Calculate vehicle stats
      const vehicleData: Record<string, VehicleStats> = {};

      bookings?.forEach((booking) => {
        const monthKey = format(parseISO(booking.start_date), 'yyyy-MM');
        
        // Monthly aggregation
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].bookings++;
          if (booking.status !== 'cancelled') {
            monthlyData[monthKey].revenue += Number(booking.total_price) || 0;
          }
        }

        // Vehicle aggregation
        const vehicle = booking.vehicle;
        if (vehicle) {
          if (!vehicleData[vehicle.id]) {
            vehicleData[vehicle.id] = {
              vehicleId: vehicle.id,
              registration: vehicle.registration,
              make: vehicle.make,
              model: vehicle.model,
              revenue: 0,
              bookings: 0,
              utilizationDays: 0,
              utilizationRate: 0,
            };
          }
          vehicleData[vehicle.id].bookings++;
          if (booking.status !== 'cancelled') {
            vehicleData[vehicle.id].revenue += Number(booking.total_price) || 0;
            const days = differenceInDays(parseISO(booking.end_date), parseISO(booking.start_date)) + 1;
            vehicleData[vehicle.id].utilizationDays += days;
          }
        }
      });

      // Calculate utilization rate (assuming 30 days per month for simplicity)
      const totalDays = monthsBack * 30;
      Object.values(vehicleData).forEach((v) => {
        v.utilizationRate = Math.min((v.utilizationDays / totalDays) * 100, 100);
      });

      // Convert to arrays
      const monthlyArray: MonthlyStats[] = Object.entries(monthlyData)
        .map(([month, data]) => ({
          month: format(parseISO(month + '-01'), 'MMM yyyy', { locale: da }),
          revenue: data.revenue,
          bookings: data.bookings,
          avgBookingValue: data.bookings > 0 ? data.revenue / data.bookings : 0,
        }))
        .reverse();

      const vehicleArray = Object.values(vehicleData).sort((a, b) => b.revenue - a.revenue);

      // Calculate summary
      const currentMonth = format(now, 'yyyy-MM');
      const lastMonth = format(subMonths(now, 1), 'yyyy-MM');
      const currentMonthData = monthlyData[currentMonth] || { revenue: 0, bookings: 0 };
      const lastMonthData = monthlyData[lastMonth] || { revenue: 0, bookings: 0 };

      const totalRevenue = Object.values(monthlyData).reduce((sum, m) => sum + m.revenue, 0);
      const totalBookings = bookings?.length || 0;

      const statusCounts = bookings?.reduce((acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const summaryData: AnalyticsSummary = {
        totalRevenue,
        totalBookings,
        avgBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
        completedBookings: statusCounts['completed'] || 0,
        cancelledBookings: statusCounts['cancelled'] || 0,
        pendingBookings: statusCounts['pending'] || 0,
        activeRecurringRentals: recurringCount || 0,
        revenueGrowth: lastMonthData.revenue > 0 
          ? ((currentMonthData.revenue - lastMonthData.revenue) / lastMonthData.revenue) * 100 
          : 0,
        bookingsGrowth: lastMonthData.bookings > 0 
          ? ((currentMonthData.bookings - lastMonthData.bookings) / lastMonthData.bookings) * 100 
          : 0,
      };

      setMonthlyStats(monthlyArray);
      setVehicleStats(vehicleArray);
      setSummary(summaryData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, monthsBack]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    monthlyStats,
    vehicleStats,
    summary,
    isLoading,
    refetch: fetchAnalytics,
  };
};
