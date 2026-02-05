import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COVERAGE-SHORTFALLS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify CRON_SECRET for scheduled calls
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logStep('Unauthorized: Invalid CRON_SECRET');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate the previous month's date range
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthStart = previousMonth.toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    const settlementMonth = `${previousMonth.getFullYear()}-${String(previousMonth.getMonth() + 1).padStart(2, '0')}`;

    logStep('Processing coverage shortfalls', { settlementMonth, monthStart, monthEnd });

    // Get all active loans
    const { data: activeLoans, error: loansError } = await supabase
      .from('fleet_vehicle_loans')
      .select(`
        id,
        vehicle_id,
        lessor_id,
        monthly_installment
      `)
      .eq('status', 'active');

    if (loansError) {
      logStep('Error fetching active loans', loansError);
      throw loansError;
    }

    logStep('Found active loans', { count: activeLoans?.length || 0 });

    const results = {
      processed: 0,
      shortfallsCreated: 0,
      shortfallsUpdated: 0,
      noShortfall: 0,
      errors: [] as string[],
    };

    for (const loan of activeLoans || []) {
      try {
        // Get vehicle registration for logging
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('registration')
          .eq('id', loan.vehicle_id)
          .single();
        
        const vehicleReg = vehicleData?.registration || loan.vehicle_id;

        // Check if shortfall already exists for this vehicle/month
        const { data: existingShortfall } = await supabase
          .from('fleet_coverage_shortfalls')
          .select('id')
          .eq('vehicle_id', loan.vehicle_id)
          .eq('month', settlementMonth)
          .single();

        if (existingShortfall) {
          logStep('Shortfall already processed', { vehicleId: loan.vehicle_id, month: settlementMonth });
          results.shortfallsUpdated++;
          continue;
        }

        // Get earnings for this vehicle in the previous month
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('total_price')
          .eq('vehicle_id', loan.vehicle_id)
          .eq('status', 'completed')
          .gte('end_date', monthStart)
          .lte('end_date', monthEnd);

        if (bookingsError) {
          logStep('Error fetching bookings', { vehicleId: loan.vehicle_id, error: bookingsError });
          results.errors.push(`Vehicle ${loan.vehicle_id}: ${bookingsError.message}`);
          continue;
        }

        const totalEarnings = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
        const requiredAmount = loan.monthly_installment || 0;
        const shortfallAmount = Math.max(0, requiredAmount - totalEarnings);

        logStep('Vehicle earnings calculated', { 
          vehicleId: loan.vehicle_id,
          registration: vehicleReg,
          totalEarnings,
          requiredAmount,
          shortfallAmount
        });

        if (shortfallAmount > 0) {
          // Create shortfall record
          const { error: insertError } = await supabase
            .from('fleet_coverage_shortfalls')
            .insert({
              vehicle_id: loan.vehicle_id,
              lessor_id: loan.lessor_id,
              month: settlementMonth,
              required_amount: requiredAmount,
              earned_amount: totalEarnings,
              shortfall_amount: shortfallAmount,
              status: 'pending',
              notes: `Automatisk beregnet: Bil ${vehicleReg} tjente ${totalEarnings} kr, men krævede ${requiredAmount} kr til afdrag.`,
            });

          if (insertError) {
            logStep('Error creating shortfall', { vehicleId: loan.vehicle_id, error: insertError });
            results.errors.push(`Vehicle ${loan.vehicle_id}: ${insertError.message}`);
          } else {
            results.shortfallsCreated++;
            logStep('Shortfall created', { vehicleId: loan.vehicle_id, amount: shortfallAmount });
          }
        } else {
          results.noShortfall++;
          logStep('No shortfall for vehicle', { vehicleId: loan.vehicle_id });
        }

        results.processed++;
      } catch (err) {
        logStep('Error processing loan', { loanId: loan.id, error: err });
        results.errors.push(`Loan ${loan.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    logStep('Coverage shortfall calculation complete', results);

    return new Response(JSON.stringify({
      success: true,
      settlementMonth,
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep('Fatal error', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
