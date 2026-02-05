import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      console.log('Unauthorized: Invalid CRON_SECRET');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const today = new Date().toISOString().split('T')[0];
    console.log(`Processing recurring rentals for date: ${today}`);

    // Fetch all active recurring rentals due for renewal
    const { data: dueRentals, error: fetchError } = await supabase
      .from('recurring_rentals')
      .select(`
        *,
        vehicle:vehicles(id, registration, make, model, monthly_price, included_km, extra_km_price)
      `)
      .eq('status', 'active')
      .lte('next_billing_date', today);

    if (fetchError) {
      console.error('Error fetching due rentals:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${dueRentals?.length || 0} rentals due for renewal`);

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const rental of dueRentals || []) {
      try {
        console.log(`Processing rental ${rental.id} for vehicle ${rental.vehicle?.registration}`);

        // Calculate next month dates
        const startDate = new Date(rental.next_billing_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1);

        // Create a new booking for the renewal period
        const { data: newBooking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            vehicle_id: rental.vehicle_id,
            lessor_id: rental.lessor_id,
            renter_id: rental.renter_id,
            renter_email: rental.renter_email,
            renter_name: rental.renter_name,
            renter_phone: rental.renter_phone,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            total_price: rental.monthly_price,
            status: 'confirmed',
            notes: `Automatisk fornyet fra gentagen lejeaftale #${rental.id.slice(0, 8)}`,
          })
          .select()
          .single();

        if (bookingError) {
          console.error(`Error creating booking for rental ${rental.id}:`, bookingError);
          results.failed++;
          results.errors.push(`Rental ${rental.id}: ${bookingError.message}`);
          continue;
        }

        // Calculate next billing date (next month)
        const nextBillingDate = new Date(rental.next_billing_date);
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        // Update the recurring rental
        const { error: updateError } = await supabase
          .from('recurring_rentals')
          .update({
            total_renewals: (rental.total_renewals || 0) + 1,
            last_renewal_at: new Date().toISOString(),
            last_renewal_booking_id: newBooking.id,
            next_billing_date: nextBillingDate.toISOString().split('T')[0],
          })
          .eq('id', rental.id);

        if (updateError) {
          console.error(`Error updating rental ${rental.id}:`, updateError);
          results.errors.push(`Update rental ${rental.id}: ${updateError.message}`);
        }

        results.processed++;
        console.log(`Successfully renewed rental ${rental.id}, new booking ${newBooking.id}`);

        // Optional: Send notification email about the renewal
        // This could be added later using the existing email functions

      } catch (err) {
        console.error(`Error processing rental ${rental.id}:`, err);
        results.failed++;
        results.errors.push(`Rental ${rental.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    console.log(`Renewal processing complete: ${results.processed} processed, ${results.failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      date: today,
      totalDue: dueRentals?.length || 0,
      ...results,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-recurring-rentals:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
