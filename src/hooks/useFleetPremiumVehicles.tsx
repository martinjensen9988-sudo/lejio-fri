import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';

// Loan/Afdrag interfaces
export interface FleetVehicleLoan {
  id: string;
  vehicle_id: string;
  description: string;
  original_amount: number;
  remaining_balance: number;
  monthly_installment: number;
  setup_fee: number;
  remaining_months: number;
  start_date: string;
  status: 'active' | 'paid_off' | 'cancelled';
}

export interface LoanPayment {
  id: string;
  loan_id: string;
  payment_date: string;
  amount: number;
  payment_type: 'installment' | 'setup_fee' | 'extra_payment';
  notes: string | null;
}

// Tire status interface
export interface TireStatus {
  id: string;
  tire_type: 'summer' | 'winter' | 'all_season';
  brand: string | null;
  tread_depth_mm: number | null;
  storage_location: string | null;
  is_mounted: boolean;
}

// GPS location interface
export interface VehicleLocation {
  latitude: number;
  longitude: number;
  last_updated: string;
  address?: string;
}

export interface FleetVehicleStats {
  // 1. Stamdata
  id: string;
  owner_id: string;
  registration: string;
  make: string;
  model: string;
  variant: string | null;
  year: number | null;
  image_url: string | null;
  current_odometer: number | null;
  vin: string | null;
  
  // 2. Økonomi-felter
  monthlyGrossRevenue: number;
  yearlyGrossRevenue: number;
  commissionRate: number; // 35% -> 20% baseret på 4-trins model
  lejioCommissionAmount: number;
  cleaningFees: number;
  netPayout: number; // Brutto - Salær - Afdrag
  
  // 3. Låne-modul felter
  activeLoan: FleetVehicleLoan | null;
  totalLoanBalance: number;
  monthlyInstallment: number;
  loanPaymentHistory: LoanPayment[];
  
  // 4. Drift & Status
  currentStatus: 'rented' | 'available' | 'maintenance' | 'cleaning';
  currentBooking: {
    renter_name: string | null;
    start_date: string;
    end_date: string;
  } | null;
  location: VehicleLocation | null;
  nextServiceDate: string | null;
  nextServiceKm: number | null;
  tireStatus: TireStatus | null;
  lastServiceLog: {
    service_type: string;
    service_date: string;
    description: string | null;
    cost: number | null;
  } | null;
  
  // 5. Garantitæller
  daysRentedThisYear: number;
  daysAvailableThisYear: number;
  guaranteeDays: number;
  guaranteePercentage: number;
  isGuaranteeMet: boolean;
  
  // Extra
  isClean: boolean;
  service_status: string | null;
}

export interface FleetPremiumSummary {
  totalVehicles: number;
  totalMonthlyGrossRevenue: number;
  totalYearlyGrossRevenue: number;
  totalCommission: number;
  totalCleaningFees: number;
  totalMonthlyInstallments: number;
  totalLoanBalance: number;
  finalNetPayout: number;
  averageUtilization: number;
  vehiclesMeetingGuarantee: number;
}

// Commission rate based on 4-tier model
export const getCommissionRate = (totalVehicles: number): number => {
  if (totalVehicles >= 20) return 0.20; // 20%
  if (totalVehicles >= 10) return 0.25; // 25%
  if (totalVehicles >= 5) return 0.30;  // 30%
  return 0.35; // 35% default
};

export const useFleetPremiumVehicles = () => {
  const { user, profile } = useAuth();
  const [vehicles, setVehicles] = useState<FleetVehicleStats[]>([]);
  const [summary, setSummary] = useState<FleetPremiumSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const GUARANTEE_DAYS = 300; // 10 months * 30 days

  const fetchVehicleData = useCallback(async () => {
    if (!user) {
      setVehicles([]);
      setSummary(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const yearStart = `${selectedYear}-01-01`;
      const yearEnd = `${selectedYear}-12-31`;
      const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const monthEnd = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];

      // Fetch all data in parallel
      const [
        vehiclesResult,
        loansResult,
        loanPaymentsResult,
        tireSetsResult,
        gpsDevicesResult,
        serviceLogsResult,
      ] = await Promise.all([
        supabase.from('vehicles').select('*').eq('owner_id', user.id),
        supabase.from('fleet_vehicle_loans').select('*').eq('lessor_id', user.id).eq('status', 'active'),
        supabase.from('fleet_loan_payments').select('*'),
        supabase.from('tire_sets').select('*'),
        supabase.from('gps_devices').select('*').eq('is_active', true),
        supabase.from('vehicle_service_logs').select('*').order('service_date', { ascending: false }),
      ]);

      const vehiclesData = vehiclesResult.data || [];
      const loansData = loansResult.data || [];
      const loanPaymentsData = loanPaymentsResult.data || [];
      const tireSetsData = tireSetsResult.data || [];
      const gpsDevicesData = gpsDevicesResult.data || [];
      const serviceLogsData = serviceLogsResult.data || [];

      // Determine commission rate based on vehicle count
      const commissionRate = getCommissionRate(vehiclesData.length);

      // Fetch bookings for these vehicles
      const vehicleIds = vehiclesData.map(v => v.id);
      
      const [yearlyBookingsResult, activeBookingsResult] = await Promise.all([
        supabase
          .from('bookings')
          .select('*')
          .in('vehicle_id', vehicleIds)
          .gte('start_date', yearStart)
          .lte('end_date', yearEnd)
          .in('status', ['completed', 'active']),
        supabase
          .from('bookings')
          .select('*')
          .in('vehicle_id', vehicleIds)
          .lte('start_date', today)
          .gte('end_date', today)
          .eq('status', 'active'),
      ]);

      const yearlyBookings = yearlyBookingsResult.data || [];
      const activeBookings = activeBookingsResult.data || [];

      // Fetch GPS locations for vehicles with devices
      const deviceVehicleMap = new Map(gpsDevicesData.map(d => [d.vehicle_id, d.id]));
      const deviceIds = gpsDevicesData.map(d => d.id);
      
      let gpsLocations: unknown[] = [];
      if (deviceIds.length > 0) {
        const { data: gpsData } = await supabase
          .from('gps_data_points')
          .select('*')
          .in('device_id', deviceIds)
          .order('recorded_at', { ascending: false })
          .limit(vehiclesData.length);
        gpsLocations = gpsData || [];
      }

      // Process each vehicle
      const processedVehicles: FleetVehicleStats[] = vehiclesData.map(vehicle => {
        // Yearly bookings for this vehicle
        const vehicleYearlyBookings = yearlyBookings.filter(b => b.vehicle_id === vehicle.id);
        const yearlyGrossRevenue = vehicleYearlyBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        // Monthly bookings
        const vehicleMonthlyBookings = vehicleYearlyBookings.filter(b => {
          const startDate = new Date(b.start_date);
          return startDate.getMonth() + 1 === selectedMonth;
        });
        const monthlyGrossRevenue = vehicleMonthlyBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        // Calculate cleaning fees from bookings (use 0 if fields don't exist)
        const cleaningFees = 0; // Cleaning fees are handled separately in Fleet Premium

        // Commission calculation
        const lejioCommissionAmount = monthlyGrossRevenue * commissionRate;

        // Loan data for this vehicle
        const vehicleLoans = loansData.filter(l => l.vehicle_id === vehicle.id);
        const activeLoan = vehicleLoans[0] || null;
        const totalLoanBalance = vehicleLoans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
        const monthlyInstallment = vehicleLoans.reduce((sum, l) => sum + (l.monthly_installment || 0), 0);
        
        // Get loan payment history
        const loanIds = vehicleLoans.map(l => l.id);
        const loanPaymentHistory = loanPaymentsData.filter(p => loanIds.includes(p.loan_id));

        // Net payout: Brutto - Commission - Installments
        const netPayout = monthlyGrossRevenue - lejioCommissionAmount - monthlyInstallment;

        // Calculate days rented this year
        const daysRentedThisYear = vehicleYearlyBookings.reduce((total, booking) => {
          const start = new Date(Math.max(new Date(booking.start_date).getTime(), new Date(yearStart).getTime()));
          const end = new Date(Math.min(new Date(booking.end_date).getTime(), new Date(yearEnd).getTime()));
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + Math.max(0, days);
        }, 0);

        // Days available (vehicle was marked as available)
        const daysAvailableThisYear = vehicle.days_available_this_year || 
          Math.min(365, Math.ceil((new Date().getTime() - new Date(yearStart).getTime()) / (1000 * 60 * 60 * 24)));

        // Current rental status
        const activeBooking = activeBookings.find(b => b.vehicle_id === vehicle.id);
        let currentStatus: 'rented' | 'available' | 'maintenance' | 'cleaning' = 'available';
        
        if (activeBooking) {
          currentStatus = 'rented';
        } else if (vehicle.service_status === 'service_required' || vehicle.service_status === 'blocked') {
          currentStatus = 'maintenance';
        }

        // GPS location
        const gpsDevice = gpsDevicesData.find(d => d.vehicle_id === vehicle.id);
        let location: VehicleLocation | null = null;
        if (gpsDevice) {
          const latestPoint = gpsLocations.find(p => p.device_id === gpsDevice.id);
          if (latestPoint) {
            location = {
              latitude: latestPoint.latitude,
              longitude: latestPoint.longitude,
              last_updated: latestPoint.recorded_at,
            };
          }
        }

        // Tire status
        const vehicleTires = tireSetsData.filter(t => t.vehicle_id === vehicle.id);
        const mountedTire = vehicleTires.find(t => t.is_mounted);
        const tireStatus: TireStatus | null = mountedTire ? {
          id: mountedTire.id,
          tire_type: mountedTire.tire_type as 'summer' | 'winter' | 'all_season',
          brand: mountedTire.brand,
          tread_depth_mm: mountedTire.tread_depth_mm,
          storage_location: mountedTire.storage_location,
          is_mounted: mountedTire.is_mounted,
        } : null;

        // Service log
        const vehicleServiceLogs = serviceLogsData.filter(s => s.vehicle_id === vehicle.id);
        const lastServiceLog = vehicleServiceLogs[0] || null;

        // Guarantee calculation
        const guaranteePercentage = Math.min((daysRentedThisYear / GUARANTEE_DAYS) * 100, 100);
        const isGuaranteeMet = daysRentedThisYear >= GUARANTEE_DAYS;

        return {
          // Stamdata
          id: vehicle.id,
          owner_id: vehicle.owner_id,
          registration: vehicle.registration,
          make: vehicle.make,
          model: vehicle.model,
          variant: vehicle.variant,
          year: vehicle.year,
          image_url: vehicle.image_url,
          current_odometer: vehicle.last_service_odometer || vehicle.current_odometer,
          vin: vehicle.vin,
          
          // Økonomi
          monthlyGrossRevenue,
          yearlyGrossRevenue,
          commissionRate,
          lejioCommissionAmount,
          cleaningFees,
          netPayout,
          
          // Låne-modul
          activeLoan: activeLoan ? {
            id: activeLoan.id,
            vehicle_id: activeLoan.vehicle_id,
            description: activeLoan.description,
            original_amount: activeLoan.original_amount,
            remaining_balance: activeLoan.remaining_balance,
            monthly_installment: activeLoan.monthly_installment,
            setup_fee: activeLoan.setup_fee || 300,
            remaining_months: activeLoan.remaining_months,
            start_date: activeLoan.start_date,
            status: activeLoan.status as 'active' | 'paid_off' | 'cancelled',
          } : null,
          totalLoanBalance,
          monthlyInstallment,
          loanPaymentHistory: loanPaymentHistory.map(p => ({
            id: p.id,
            loan_id: p.loan_id,
            payment_date: p.payment_date,
            amount: p.amount,
            payment_type: p.payment_type as 'installment' | 'setup_fee' | 'extra_payment',
            notes: p.notes,
          })),
          
          // Drift & Status
          currentStatus,
          currentBooking: activeBooking ? {
            renter_name: activeBooking.renter_name || `${activeBooking.renter_first_name || ''} ${activeBooking.renter_last_name || ''}`.trim(),
            start_date: activeBooking.start_date,
            end_date: activeBooking.end_date,
          } : null,
          location,
          nextServiceDate: vehicle.last_service_date ? 
            new Date(new Date(vehicle.last_service_date).setMonth(new Date(vehicle.last_service_date).getMonth() + (vehicle.service_interval_months || 12))).toISOString().split('T')[0] 
            : null,
          nextServiceKm: vehicle.last_service_odometer ? vehicle.last_service_odometer + (vehicle.service_interval_km || 15000) : null,
          tireStatus,
          lastServiceLog: lastServiceLog ? {
            service_type: lastServiceLog.service_type,
            service_date: lastServiceLog.service_date,
            description: lastServiceLog.description,
            cost: lastServiceLog.cost,
          } : null,
          
          // Garantitæller
          daysRentedThisYear,
          daysAvailableThisYear,
          guaranteeDays: GUARANTEE_DAYS,
          guaranteePercentage,
          isGuaranteeMet,
          
          // Extra
          isClean: true,
          service_status: vehicle.service_status,
        };
      });

      setVehicles(processedVehicles);

      // Calculate summary
      const totalMonthlyGrossRevenue = processedVehicles.reduce((sum, v) => sum + v.monthlyGrossRevenue, 0);
      const totalYearlyGrossRevenue = processedVehicles.reduce((sum, v) => sum + v.yearlyGrossRevenue, 0);
      const totalCommission = processedVehicles.reduce((sum, v) => sum + v.lejioCommissionAmount, 0);
      const totalCleaningFees = processedVehicles.reduce((sum, v) => sum + v.cleaningFees, 0);
      const totalMonthlyInstallments = processedVehicles.reduce((sum, v) => sum + v.monthlyInstallment, 0);
      const totalLoanBalance = processedVehicles.reduce((sum, v) => sum + v.totalLoanBalance, 0);
      const finalNetPayout = processedVehicles.reduce((sum, v) => sum + v.netPayout, 0);
      const averageUtilization = processedVehicles.length > 0 
        ? (processedVehicles.reduce((sum, v) => sum + v.guaranteePercentage, 0) / processedVehicles.length)
        : 0;
      const vehiclesMeetingGuarantee = processedVehicles.filter(v => v.isGuaranteeMet).length;

      setSummary({
        totalVehicles: processedVehicles.length,
        totalMonthlyGrossRevenue,
        totalYearlyGrossRevenue,
        totalCommission,
        totalCleaningFees,
        totalMonthlyInstallments,
        totalLoanBalance,
        finalNetPayout,
        averageUtilization,
        vehiclesMeetingGuarantee,
      });

    } catch (error) {
      console.error('Error fetching fleet premium data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedYear, selectedMonth]);

  useEffect(() => {
    fetchVehicleData();
  }, [fetchVehicleData]);

  return {
    vehicles,
    summary,
    isLoading,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    refetch: fetchVehicleData,
    GUARANTEE_DAYS,
    getCommissionRate,
  };
};
