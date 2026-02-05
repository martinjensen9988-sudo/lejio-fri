import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContractRequest {
  bookingId: string;
  vehicleValue?: number;
  renterLicenseNumber?: string;
  depositAmount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId, vehicleValue, renterLicenseNumber, depositAmount }: ContractRequest = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Creating contract for booking: ${bookingId}`);

    // Fetch booking with vehicle data
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicle:vehicles(*)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking fetch error:', bookingError);
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch pickup location if set
    let pickupLocation = null;
    if (booking.pickup_location_id) {
      const { data: locationData } = await supabase
        .from('dealer_locations')
        .select('name, address, city, postal_code, phone')
        .eq('id', booking.pickup_location_id)
        .single();
      pickupLocation = locationData;
    }

    // Verify user is the lessor OR has an admin role
    if (booking.lessor_id !== user.id) {
      const { data: roleRows, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['support', 'admin', 'super_admin']);

      const isAdmin = !roleError && (roleRows?.length || 0) > 0;
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Not authorized' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch lessor profile
    const { data: lessorProfile, error: lessorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (lessorError) {
      console.error('Lessor profile error:', lessorError);
    }

    // Generate contract number
    const { data: contractNumber, error: numError } = await supabase
      .rpc('generate_contract_number');

    if (numError) {
      console.error('Contract number error:', numError);
      return new Response(JSON.stringify({ error: 'Failed to generate contract number' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const vehicle = booking.vehicle;
    
    // Fallback: Hvis vehicle data mangler, fetch direkte fra vehicles tabel
    if (!vehicle || !vehicle.make || !vehicle.model) {
      const { data: vehicleData, error: vError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', booking.vehicle_id)
        .single();
      
      if (!vError && vehicleData) {
        // Merge data
        Object.assign(vehicle || {}, vehicleData);
      }
    }
    
    const calculatedVehicleValue = vehicleValue || 150000; // Default value if not provided

    // Determine pricing based on booking period type
    const displayPrice = booking.base_price || vehicle.daily_price || 499;
    let includedKm = booking.included_km || vehicle.included_km || 100;
    let extraKmPrice = booking.extra_km_price || vehicle.extra_km_price || 2.50;

    // If booking has unlimited km, set included_km to 0 and extra_km_price to 0 (will show as "unlimited" in contract)
    if (booking.unlimited_km) {
      includedKm = 0;
      extraKmPrice = 0;
    }

    // Calculate deductible: if renter selected 0-deductible insurance, set to 0
    const deductibleAmount = booking.deductible_insurance_selected ? 0 : (booking.original_deductible || 5000);

    // Generér tilfældig 6-cifret PIN til check-in
    function generatePin(length = 6) {
      let pin = '';
      for (let i = 0; i < length; i++) {
        pin += Math.floor(Math.random() * 10);
      }
      return pin;
    }
    const checkinPin = generatePin(6);

    // Create contract record
    const contractData = {
      booking_id: bookingId,
      vehicle_id: booking.vehicle_id,
      lessor_id: user.id,
      renter_id: booking.renter_id,
      contract_number: contractNumber,
      contract_type: lessorProfile?.user_type === 'professionel' ? 'business' : 'standard',
      
      // Vehicle details
      vehicle_registration: vehicle.registration,
      vehicle_make: vehicle.make,
      vehicle_model: vehicle.model,
      vehicle_year: vehicle.year,
      vehicle_vin: vehicle.vin,
      vehicle_value: calculatedVehicleValue,
      
      // Rental terms - use booking data, fallback to vehicle data
      start_date: booking.start_date,
      end_date: booking.end_date,
      daily_price: displayPrice,
      included_km: includedKm,
      extra_km_price: extraKmPrice,
      total_price: booking.total_price,
      deposit_amount: depositAmount || booking.deposit_amount || 2500,
      
      // Lessor details
      lessor_name: lessorProfile?.full_name || user.email,
      lessor_email: lessorProfile?.email || user.email,
      lessor_phone: lessorProfile?.phone,
      lessor_address: lessorProfile?.address ? 
        `${lessorProfile.address}, ${lessorProfile.postal_code} ${lessorProfile.city}` : null,
      lessor_company_name: lessorProfile?.company_name,
      lessor_cvr: lessorProfile?.cvr_number,
      
      // Renter details
      renter_name: booking.renter_first_name && booking.renter_last_name 
        ? `${booking.renter_first_name} ${booking.renter_last_name}` 
        : (booking.renter_name || 'Afventer lejer'),
      renter_email: booking.renter_email || '',
      renter_phone: booking.renter_phone,
      renter_license_number: booking.renter_license_number || renterLicenseNumber,
      renter_license_country: booking.renter_license_country || null,
      renter_license_issue_date: booking.renter_license_issue_date || null,
      renter_birth_date: booking.renter_birth_date || null,
      renter_street_address: booking.renter_address || null,
      renter_postal_code: booking.renter_postal_code || null,
      renter_city: booking.renter_city || null,
      renter_address: booking.renter_address && booking.renter_postal_code && booking.renter_city
        ? `${booking.renter_address}, ${booking.renter_postal_code} ${booking.renter_city}`
        : null,
      
      // Deductible insurance info
      deductible_insurance_selected: booking.deductible_insurance_selected || false,
      deductible_insurance_price: booking.deductible_insurance_price || 0,
      
      // Pickup location details
      pickup_location_name: pickupLocation?.name || null,
      pickup_location_address: pickupLocation ? 
        `${pickupLocation.address}, ${pickupLocation.postal_code} ${pickupLocation.city}` : null,
      pickup_location_phone: pickupLocation?.phone || null,
      
      // Insurance
      insurance_company: lessorProfile?.insurance_company,
      insurance_policy_number: lessorProfile?.insurance_policy_number,
      deductible_amount: deductibleAmount,
      
      // Vanvidskørsel
      vanvidskørsel_accepted: false,
      vanvidskørsel_liability_amount: calculatedVehicleValue,
      
      // Roadside assistance
      roadside_assistance_provider: lessorProfile?.roadside_assistance_provider || null,
      roadside_assistance_phone: lessorProfile?.roadside_assistance_phone || null,
      
      // Fuel policy
      fuel_policy_enabled: lessorProfile?.fuel_policy_enabled || false,
      fuel_missing_fee: lessorProfile?.fuel_missing_fee || 0,
      fuel_price_per_liter: lessorProfile?.fuel_price_per_liter || 0,
      
      // Cleaning fees from vehicle
      exterior_cleaning_fee: vehicle.exterior_cleaning_fee || 350,
      interior_cleaning_fee: vehicle.interior_cleaning_fee || 500,
      
      // Pickup/Dropoff times
      pickup_time: booking.pickup_time || vehicle.default_pickup_time || '10:00',
      dropoff_time: booking.dropoff_time || vehicle.default_dropoff_time || '08:00',
      late_return_fee_enabled: vehicle.late_return_charge_enabled !== false,
      
      // Logo - use company logo for professionals, otherwise null (LEJIO logo in frontend)
      logo_url: lessorProfile?.user_type === 'professionel' && lessorProfile?.company_logo_url 
        ? lessorProfile.company_logo_url 
        : null,
      
      status: 'pending_renter_signature',
      checkin_pin: checkinPin,
    };

    const { data: contract, error: insertError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (insertError) {
      console.error('Contract insert error:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create contract', details: insertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Contract created: ${contract.id}`);

    return new Response(JSON.stringify({ contract }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-contract function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
