import { useState, useEffect, useCallback } from 'react';
import { useFriBookings, Booking } from './useFriBookings';
import { useFriInvoices, Invoice } from './useFriInvoices';
import { useFriVehicles, Vehicle } from './useFriVehicles';

export interface AnalyticsData {
  // Revenue
  totalRevenue: number;
  monthlyRevenue: number;
  averageBookingValue: number;
  
  // Bookings
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingRate: number; // percentage of bookings vs vehicles
  
  // Vehicles
  totalVehicles: number;
  availableVehicles: number;
  rentedVehicles: number;
  maintenanceVehicles: number;
  
  // Invoices
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  outstandingBalance: number;
  
  // Charts
  monthlyRevenueTrend: Array<{ month: string; revenue: number }>;
  bookingsByStatus: Array<{ name: string; value: number }>;
  vehicleDistribution: Array<{ name: string; value: number }>;
  topVehicles: Array<{ make: string; model: string; bookings: number; revenue: number }>;
  dailyBookings: Array<{ date: string; bookings: number }>;
}

export function useFriAnalytics(lessorId: string | null) {
  const { bookings, loading: bookingsLoading } = useFriBookings(lessorId);
  const { invoices, loading: invoicesLoading } = useFriInvoices(lessorId);
  const { vehicles, loading: vehiclesLoading } = useFriVehicles(lessorId);
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  const calculateAnalytics = useCallback(() => {
    if (!bookings || !invoices || !vehicles) return;

    setLoading(true);

    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Revenue calculations
      const totalRevenue = invoices.reduce(
        (sum, inv) => sum + (inv.status === 'paid' ? inv.amount + (inv.tax_amount || 0) : 0),
        0
      );

      const monthlyRevenue = invoices
        .filter((inv) => {
          const invDate = new Date(inv.issued_date);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        })
        .reduce((sum, inv) => sum + (inv.amount + (inv.tax_amount || 0)), 0);

      const averageBookingValue = bookings.length > 0 ? totalRevenue / bookings.length : 0;

      // Booking calculations
      const activeBookings = bookings.filter(
        (b) => b.status === 'confirmed' || b.status === 'pending'
      ).length;
      const completedBookings = bookings.filter((b) => b.status === 'completed').length;
      const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;
      const bookingRate = vehicles.length > 0 ? (bookings.length / vehicles.length) * 100 : 0;

      // Vehicle calculations
      const availableVehicles = vehicles.filter((v) => v.availability_status === 'available').length;
      const rentedVehicles = vehicles.filter((v) => v.availability_status === 'rented').length;
      const maintenanceVehicles = vehicles.filter((v) => v.availability_status === 'maintenance').length;

      // Invoice calculations
      const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
      const overdueInvoices = invoices.filter((inv) => {
        if (inv.status === 'paid' || inv.status === 'cancelled') return false;
        return new Date(inv.due_date) < new Date();
      }).length;
      const outstandingBalance = invoices.reduce((sum, inv) => {
        if (inv.status === 'paid' || inv.status === 'cancelled') return sum;
        return sum + (inv.amount + (inv.tax_amount || 0));
      }, 0);

      // Monthly revenue trend (last 12 months)
      const monthlyRevenueTrend = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(currentYear, currentMonth - i, 1);
        const month = date.toLocaleString('da-DK', { month: 'short', year: '2-digit' });
        const revenue = invoices
          .filter((inv) => {
            const invDate = new Date(inv.issued_date);
            return invDate.getMonth() === date.getMonth() && invDate.getFullYear() === date.getFullYear();
          })
          .reduce((sum, inv) => sum + (inv.amount + (inv.tax_amount || 0)), 0);
        monthlyRevenueTrend.push({ month, revenue });
      }

      // Bookings by status
      const bookingsByStatus = [
        { name: 'Afventer', value: bookings.filter((b) => b.status === 'pending').length },
        { name: 'Bekræftet', value: bookings.filter((b) => b.status === 'confirmed').length },
        { name: 'Afsluttet', value: completedBookings },
        { name: 'Aflyst', value: cancelledBookings },
      ];

      // Vehicle distribution
      const vehicleDistribution = [
        { name: 'Ledig', value: availableVehicles },
        { name: 'Udlejet', value: rentedVehicles },
        { name: 'Vedligehold', value: maintenanceVehicles },
      ];

      // Top vehicles by bookings
      const vehicleBookingMap = new Map<string, { vehicle: Vehicle; count: number; revenue: number }>();
      
      bookings.forEach((booking) => {
        if (!vehicleBookingMap.has(booking.vehicle_id)) {
          const vehicle = vehicles.find((v) => v.id === booking.vehicle_id);
          if (vehicle) {
            vehicleBookingMap.set(booking.vehicle_id, { vehicle, count: 0, revenue: 0 });
          }
        }
        const entry = vehicleBookingMap.get(booking.vehicle_id);
        if (entry) {
          entry.count += 1;
          // Add invoice amount if exists
          const relatedInvoice = invoices.find((inv) => inv.booking_id === booking.id);
          if (relatedInvoice) {
            entry.revenue += relatedInvoice.amount + (relatedInvoice.tax_amount || 0);
          }
        }
      });

      const topVehicles = Array.from(vehicleBookingMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((entry) => ({
          make: entry.vehicle.make,
          model: entry.vehicle.model,
          bookings: entry.count,
          revenue: entry.revenue,
        }));

      // Daily bookings (last 30 days)
      const dailyBookings = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('da-DK');
        const count = bookings.filter((b) => {
          const bookingDate = new Date(b.start_date).toLocaleDateString('da-DK');
          return bookingDate === dateStr;
        }).length;
        dailyBookings.push({ date: dateStr, bookings: count });
      }

      setAnalytics({
        totalRevenue,
        monthlyRevenue,
        averageBookingValue,
        totalBookings: bookings.length,
        activeBookings,
        completedBookings,
        cancelledBookings,
        bookingRate,
        totalVehicles: vehicles.length,
        availableVehicles,
        rentedVehicles,
        maintenanceVehicles,
        totalInvoices: invoices.length,
        paidInvoices,
        overdueInvoices,
        outstandingBalance,
        monthlyRevenueTrend,
        bookingsByStatus,
        vehicleDistribution,
        topVehicles,
        dailyBookings,
      });
    } catch (err) {
      console.error('Error calculating analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [bookings, invoices, vehicles]);

  useEffect(() => {
    if (!bookingsLoading && !invoicesLoading && !vehiclesLoading) {
      calculateAnalytics();
    }
  }, [bookings, invoices, vehicles, bookingsLoading, invoicesLoading, vehiclesLoading, calculateAnalytics]);

  return {
    analytics,
    loading: loading || bookingsLoading || invoicesLoading || vehiclesLoading,
  };
}
