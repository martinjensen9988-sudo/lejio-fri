import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Commission rate based on vehicle count
function getCommissionRate(vehicleCount: number): number {
  if (vehicleCount >= 20) return 0.20;
  if (vehicleCount >= 10) return 0.25;
  if (vehicleCount >= 5) return 0.30;
  return 0.35;
}

const GUARANTEE_DAYS = 300;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;
    const today = now.toISOString().split('T')[0];

    console.log(`[calculate-fleet-premium-stats] Starting calculation for ${currentYear}-${currentMonth}`);

    // Fetch all fleet customers
    const { data: fleetProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .not('fleet_plan', 'is', null);

    if (profilesError) throw profilesError;

    const fleetOwnerIds = (fleetProfiles || []).map((p: unknown) => p.id);

    if (fleetOwnerIds.length === 0) {
      console.log('[calculate-fleet-premium-stats] No fleet customers found');
      
      // Store empty result
      await supabase.from('fleet_premium_cache').upsert({
        cache_key: `fleet_stats_${currentYear}_${currentMonth}`,
        data: { customers: [], allVehicles: [], globalSummary: null },
        calculated_at: now.toISOString(),
        expires_at: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
        updated_at: now.toISOString(),
      }, { onConflict: 'cache_key' });

      return new Response(JSON.stringify({ success: true, message: 'No fleet customers' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch all vehicles for fleet customers
    const { data: vehiclesData, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('*')
      .in('owner_id', fleetOwnerIds);

    if (vehiclesError) throw vehiclesError;

    const vehicleIds = (vehiclesData || []).map((v: unknown) => v.id);

    // Fetch supporting data in parallel
    const [
      loansResult,
      loanPaymentsResult,
      tireSetsResult,
      gpsDevicesResult,
      serviceLogsResult,
      yearlyBookingsResult,
      activeBookingsResult,
    ] = await Promise.all([
      supabase.from('fleet_vehicle_loans').select('*').in('lessor_id', fleetOwnerIds).eq('status', 'active'),
      supabase.from('fleet_loan_payments').select('*'),
      vehicleIds.length > 0 ? supabase.from('tire_sets').select('*').in('vehicle_id', vehicleIds) : { data: [] },
      vehicleIds.length > 0 ? supabase.from('gps_devices').select('*').in('vehicle_id', vehicleIds).eq('is_active', true) : { data: [] },
      vehicleIds.length > 0 ? supabase.from('vehicle_service_logs').select('*').in('vehicle_id', vehicleIds).order('service_date', { ascending: false }) : { data: [] },
      vehicleIds.length > 0 ? supabase.from('bookings').select('*').in('vehicle_id', vehicleIds).gte('start_date', yearStart).lte('end_date', yearEnd).in('status', ['completed', 'active']) : { data: [] },
      vehicleIds.length > 0 ? supabase.from('bookings').select('*').in('vehicle_id', vehicleIds).lte('start_date', today).gte('end_date', today).eq('status', 'active') : { data: [] },
    ]);

    const loansData = loansResult.data || [];
    const loanPaymentsData = loanPaymentsResult.data || [];
    const tireSetsData = tireSetsResult.data || [];
    const gpsDevicesData = gpsDevicesResult.data || [];
    const serviceLogsData = serviceLogsResult.data || [];
    const yearlyBookings = yearlyBookingsResult.data || [];
    const activeBookings = activeBookingsResult.data || [];

    // Fetch GPS locations
    const deviceIds = gpsDevicesData.map((d: unknown) => d.id);
    let gpsLocations: Record<string, unknown>[] = [];
    if (deviceIds.length > 0) {
      const { data: gpsData } = await supabase
        .from('gps_data_points')
        .select('*')
        .in('device_id', deviceIds)
        .order('recorded_at', { ascending: false })
        .limit(vehicleIds.length);
      gpsLocations = gpsData || [];
    }

    // Process each customer
    const processedCustomers: Record<string, unknown>[] = [];
    const allProcessedVehicles: Record<string, unknown>[] = [];

    for (const profile of fleetProfiles || []) {
      const customerVehicles = (vehiclesData || []).filter((v: unknown) => v.owner_id === profile.id);
      const commissionRate = profile.fleet_commission_rate 
        ? profile.fleet_commission_rate / 100 
        : getCommissionRate(customerVehicles.length);

      const processedVehicles: Record<string, unknown>[] = customerVehicles.map((vehicle: Record<string, unknown>) => {
        const vehicleYearlyBookings = yearlyBookings.filter((b: unknown) => b.vehicle_id === vehicle.id);
        const yearlyGrossRevenue = vehicleYearlyBookings.reduce((sum: number, b: unknown) => sum + (b.total_price || 0), 0);

        const vehicleMonthlyBookings = vehicleYearlyBookings.filter((b: unknown) => {
          const startDate = new Date(b.start_date);
          return startDate.getMonth() + 1 === currentMonth;
        });
        const monthlyGrossRevenue = vehicleMonthlyBookings.reduce((sum: number, b: unknown) => sum + (b.total_price || 0), 0);

        const lejioCommissionAmount = monthlyGrossRevenue * commissionRate;

        const vehicleLoans = loansData.filter((l: unknown) => l.vehicle_id === vehicle.id);
        const activeLoan = vehicleLoans[0] || null;
        const totalLoanBalance = vehicleLoans.reduce((sum: number, l: unknown) => sum + (l.remaining_balance || 0), 0);
        const monthlyInstallment = vehicleLoans.reduce((sum: number, l: unknown) => sum + (l.monthly_installment || 0), 0);

        const loanIds = vehicleLoans.map((l: unknown) => l.id);
        const loanPaymentHistory = loanPaymentsData.filter((p: unknown) => loanIds.includes(p.loan_id));

        const netPayout = monthlyGrossRevenue - lejioCommissionAmount - monthlyInstallment;

        const daysRentedThisYear = vehicleYearlyBookings.reduce((total: number, booking: unknown) => {
          const start = new Date(Math.max(new Date(booking.start_date).getTime(), new Date(yearStart).getTime()));
          const end = new Date(Math.min(new Date(booking.end_date).getTime(), new Date(yearEnd).getTime()));
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return total + Math.max(0, days);
        }, 0);

        const daysAvailableThisYear = vehicle.days_available_this_year ||
          Math.min(365, Math.ceil((now.getTime() - new Date(yearStart).getTime()) / (1000 * 60 * 60 * 24)));

        const activeBooking = activeBookings.find((b: unknown) => b.vehicle_id === vehicle.id);
        let currentStatus = 'available';

        if (activeBooking) {
          currentStatus = 'rented';
        } else if (vehicle.service_status === 'service_required' || vehicle.service_status === 'blocked') {
          currentStatus = 'maintenance';
        }

        const gpsDevice = gpsDevicesData.find((d: unknown) => d.vehicle_id === vehicle.id);
        let location = null;
        if (gpsDevice) {
          const latestPoint = gpsLocations.find((p: unknown) => p.device_id === gpsDevice.id);
          if (latestPoint) {
            location = {
              latitude: latestPoint.latitude,
              longitude: latestPoint.longitude,
              last_updated: latestPoint.recorded_at,
            };
          }
        }

        const vehicleTires = tireSetsData.filter((t: unknown) => t.vehicle_id === vehicle.id);
        const mountedTire = vehicleTires.find((t: unknown) => t.is_mounted);
        const tireStatus = mountedTire ? {
          id: mountedTire.id,
          tire_type: mountedTire.tire_type,
          brand: mountedTire.brand,
          tread_depth_mm: mountedTire.tread_depth_mm,
          storage_location: mountedTire.storage_location,
          is_mounted: mountedTire.is_mounted,
        } : null;

        const vehicleServiceLogs = serviceLogsData.filter((s: unknown) => s.vehicle_id === vehicle.id);
        const lastServiceLog = vehicleServiceLogs[0] || null;

        const guaranteePercentage = Math.min((daysRentedThisYear / GUARANTEE_DAYS) * 100, 100);
        const isGuaranteeMet = daysRentedThisYear >= GUARANTEE_DAYS;

        return {
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
          monthlyGrossRevenue,
          yearlyGrossRevenue,
          commissionRate,
          lejioCommissionAmount,
          cleaningFees: 0,
          netPayout,
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
            status: activeLoan.status,
          } : null,
          totalLoanBalance,
          monthlyInstallment,
          loanPaymentHistory: loanPaymentHistory.map((p: unknown) => ({
            id: p.id,
            loan_id: p.loan_id,
            payment_date: p.payment_date,
            amount: p.amount,
            payment_type: p.payment_type,
            notes: p.notes,
          })),
          currentStatus,
          currentBooking: activeBooking ? {
            renter_name: activeBooking.renter_name || `${activeBooking.renter_first_name || ''} ${activeBooking.renter_last_name || ''}`.trim(),
            start_date: activeBooking.start_date,
            end_date: activeBooking.end_date,
          } : null,
          location,
          nextServiceDate: vehicle.last_service_date
            ? new Date(new Date(vehicle.last_service_date).setMonth(new Date(vehicle.last_service_date).getMonth() + (vehicle.service_interval_months || 12))).toISOString().split('T')[0]
            : null,
          nextServiceKm: vehicle.last_service_odometer ? vehicle.last_service_odometer + (vehicle.service_interval_km || 15000) : null,
          tireStatus,
          lastServiceLog: lastServiceLog ? {
            service_type: lastServiceLog.service_type,
            service_date: lastServiceLog.service_date,
            description: lastServiceLog.description,
            cost: lastServiceLog.cost,
          } : null,
          daysRentedThisYear,
          daysAvailableThisYear,
          guaranteeDays: GUARANTEE_DAYS,
          guaranteePercentage,
          isGuaranteeMet,
          isClean: true,
          service_status: vehicle.service_status,
        };
      });

      allProcessedVehicles.push(...processedVehicles);

      const totalMonthlyGrossRevenue = processedVehicles.reduce((sum: number, v: unknown) => sum + v.monthlyGrossRevenue, 0);
      const totalYearlyGrossRevenue = processedVehicles.reduce((sum: number, v: unknown) => sum + v.yearlyGrossRevenue, 0);
      const totalCommission = processedVehicles.reduce((sum: number, v: unknown) => sum + v.lejioCommissionAmount, 0);
      const totalMonthlyInstallments = processedVehicles.reduce((sum: number, v: unknown) => sum + v.monthlyInstallment, 0);
      const totalLoanBalance = processedVehicles.reduce((sum: number, v: unknown) => sum + v.totalLoanBalance, 0);
      const finalNetPayout = processedVehicles.reduce((sum: number, v: unknown) => sum + v.netPayout, 0);
      const averageUtilization = processedVehicles.length > 0
        ? (processedVehicles.reduce((sum: number, v: unknown) => sum + v.guaranteePercentage, 0) / processedVehicles.length)
        : 0;
      const vehiclesMeetingGuarantee = processedVehicles.filter((v: unknown) => v.isGuaranteeMet).length;

      processedCustomers.push({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name,
        company_name: profile.company_name,
        fleet_plan: profile.fleet_plan,
        fleet_commission_rate: profile.fleet_commission_rate,
        vehicles: processedVehicles,
        summary: {
          totalVehicles: processedVehicles.length,
          totalMonthlyGrossRevenue,
          totalYearlyGrossRevenue,
          totalCommission,
          totalCleaningFees: 0,
          totalMonthlyInstallments,
          totalLoanBalance,
          finalNetPayout,
          averageUtilization,
          vehiclesMeetingGuarantee,
        },
      });
    }

    // Calculate global summary
    const globalTotalMonthlyGross = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.monthlyGrossRevenue, 0);
    const globalTotalYearlyGross = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.yearlyGrossRevenue, 0);
    const globalTotalCommission = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.lejioCommissionAmount, 0);
    const globalTotalInstallments = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.monthlyInstallment, 0);
    const globalTotalLoanBalance = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.totalLoanBalance, 0);
    const globalFinalNetPayout = allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.netPayout, 0);
    const globalAverageUtilization = allProcessedVehicles.length > 0
      ? (allProcessedVehicles.reduce((sum: number, v: unknown) => sum + v.guaranteePercentage, 0) / allProcessedVehicles.length)
      : 0;
    const globalVehiclesMeetingGuarantee = allProcessedVehicles.filter((v: unknown) => v.isGuaranteeMet).length;

    const globalSummary = {
      totalVehicles: allProcessedVehicles.length,
      totalMonthlyGrossRevenue: globalTotalMonthlyGross,
      totalYearlyGrossRevenue: globalTotalYearlyGross,
      totalCommission: globalTotalCommission,
      totalCleaningFees: 0,
      totalMonthlyInstallments: globalTotalInstallments,
      totalLoanBalance: globalTotalLoanBalance,
      finalNetPayout: globalFinalNetPayout,
      averageUtilization: globalAverageUtilization,
      vehiclesMeetingGuarantee: globalVehiclesMeetingGuarantee,
    };

    // Store in cache
    const cacheData = {
      customers: processedCustomers,
      allVehicles: allProcessedVehicles,
      globalSummary,
      totalCustomers: processedCustomers.length,
    };

    const { error: upsertError } = await supabase.from('fleet_premium_cache').upsert({
      cache_key: `fleet_stats_${currentYear}_${currentMonth}`,
      data: cacheData,
      calculated_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
    }, { onConflict: 'cache_key' });

    if (upsertError) throw upsertError;

    console.log(`[calculate-fleet-premium-stats] Successfully cached ${processedCustomers.length} customers, ${allProcessedVehicles.length} vehicles`);

    return new Response(JSON.stringify({ 
      success: true, 
      customers: processedCustomers.length,
      vehicles: allProcessedVehicles.length,
      calculated_at: now.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[calculate-fleet-premium-stats] Error:', errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
