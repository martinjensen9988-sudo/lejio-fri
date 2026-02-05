import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validation helpers
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPhone = (phone: string): boolean => {
  // Danish phone format: +45 12345678 or 12345678 or with spaces/dashes
  return /^(\+45\s?)?[0-9\s\-()]{8,15}$/.test(phone.replace(/\s/g, ''));
};

const sanitizeString = (str: string | null | undefined, maxLength: number = 500): string | null => {
  if (!str) return null;
  // Trim, limit length, and remove potential script tags
  return str.trim().substring(0, maxLength).replace(/<script[^>]*>.*?<\/script>/gi, '').replace(/<[^>]*>/g, '');
};

const isValidDate = (dateStr: string): boolean => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const isValidUUID = (uuid: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

interface BookingInput {
  vehicle_id: string;
  start_date: string;
  end_date: string;
  renter_first_name: string;
  renter_last_name: string;
  renter_email: string;
  renter_phone: string;
  renter_address?: string;
  renter_postal_code?: string;
  renter_city?: string;
  renter_birth_date?: string;
  renter_license_number?: string;
  renter_license_issue_date?: string;
  renter_license_country?: string;
  notes?: string;
  period_type?: 'daily' | 'weekly' | 'monthly';
  period_count?: number;
  pickup_time?: string;
  dropoff_time?: string;
  has_extra_driver?: boolean;
  extra_driver_first_name?: string;
  extra_driver_last_name?: string;
  extra_driver_birth_date?: string;
  extra_driver_license_number?: string;
  extra_driver_license_issue_date?: string;
  extra_driver_license_country?: string;
  deductible_insurance_selected?: boolean;
  deductible_insurance_price?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get authorization header for user authentication
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user-context client to verify authentication
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const input: BookingInput = await req.json();

    // Validate required fields
    const errors: string[] = [];

    // Vehicle ID validation
    if (!input.vehicle_id || !isValidUUID(input.vehicle_id)) {
      errors.push("Invalid vehicle ID format");
    }

    // Date validation
    if (!input.start_date || !isValidDate(input.start_date)) {
      errors.push("Invalid start date");
    }
    if (!input.end_date || !isValidDate(input.end_date)) {
      errors.push("Invalid end date");
    }
    if (input.start_date && input.end_date) {
      const startDate = new Date(input.start_date);
      const endDate = new Date(input.end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (startDate < today) {
        errors.push("Start date cannot be in the past");
      }
      if (endDate < startDate) {
        errors.push("End date must be after start date");
      }
    }

    // Name validation
    if (!input.renter_first_name || input.renter_first_name.trim().length < 1) {
      errors.push("First name is required");
    }
    if (!input.renter_last_name || input.renter_last_name.trim().length < 1) {
      errors.push("Last name is required");
    }
    if (input.renter_first_name && input.renter_first_name.length > 100) {
      errors.push("First name is too long (max 100 characters)");
    }
    if (input.renter_last_name && input.renter_last_name.length > 100) {
      errors.push("Last name is too long (max 100 characters)");
    }

    // Email validation
    if (!input.renter_email || !isValidEmail(input.renter_email)) {
      errors.push("Valid email is required");
    }

    // Phone validation
    if (!input.renter_phone || !isValidPhone(input.renter_phone)) {
      errors.push("Valid phone number is required (Danish format)");
    }

    // Extra driver validation if enabled
    if (input.has_extra_driver) {
      if (!input.extra_driver_first_name || input.extra_driver_first_name.trim().length < 1) {
        errors.push("Extra driver first name is required");
      }
      if (!input.extra_driver_last_name || input.extra_driver_last_name.trim().length < 1) {
        errors.push("Extra driver last name is required");
      }
    }

    // Return validation errors
    if (errors.length > 0) {
      return new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify vehicle exists and is available
    const { data: vehicle, error: vehicleError } = await supabase
      .from("vehicles")
      .select("id, owner_id, daily_price, weekly_price, monthly_price, included_km, extra_km_price, unlimited_km, is_available")
      .eq("id", input.vehicle_id)
      .single();

    if (vehicleError || !vehicle) {
      return new Response(
        JSON.stringify({ error: "Vehicle not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!vehicle.is_available) {
      return new Response(
        JSON.stringify({ error: "Vehicle is not available for booking" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side price calculation to prevent manipulation
    const startDate = new Date(input.start_date);
    const endDate = new Date(input.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let basePrice = 0;
    const periodType = input.period_type || 'daily';
    const periodCount = input.period_count || days;
    
    switch (periodType) {
      case 'monthly':
        basePrice = (vehicle.monthly_price || 0) * periodCount;
        break;
      case 'weekly':
        basePrice = (vehicle.weekly_price || 0) * periodCount;
        break;
      default:
        basePrice = (vehicle.daily_price || 0) * periodCount;
    }

    // Calculate deductible insurance if selected
    let deductibleInsuranceAmount = 0;
    if (input.deductible_insurance_selected && input.deductible_insurance_price) {
      // Verify price is reasonable (max 49kr per day)
      const maxInsurance = days * 49;
      deductibleInsuranceAmount = Math.min(input.deductible_insurance_price, maxInsurance);
    }

    const totalPrice = basePrice + deductibleInsuranceAmount;

    // Sanitize text inputs
    const sanitizedNotes = sanitizeString(input.notes, 1000);
    const sanitizedAddress = sanitizeString(input.renter_address, 200);
    const sanitizedCity = sanitizeString(input.renter_city, 100);
    const sanitizedPostalCode = sanitizeString(input.renter_postal_code, 10);
    const sanitizedLicenseNumber = sanitizeString(input.renter_license_number, 50);
    const sanitizedLicenseCountry = sanitizeString(input.renter_license_country, 50);

    // Create booking with server-validated data
    const bookingData = {
      vehicle_id: input.vehicle_id,
      lessor_id: vehicle.owner_id,
      renter_id: user.id,
      start_date: input.start_date,
      end_date: input.end_date,
      total_price: totalPrice,
      status: "pending",
      renter_name: `${sanitizeString(input.renter_first_name, 100)} ${sanitizeString(input.renter_last_name, 100)}`,
      renter_email: input.renter_email.trim().toLowerCase(),
      renter_phone: input.renter_phone.trim(),
      notes: sanitizedNotes,
      period_type: periodType,
      period_count: periodCount,
      daily_price: vehicle.daily_price,
      weekly_price: vehicle.weekly_price,
      monthly_price: vehicle.monthly_price,
      base_price: basePrice,
      included_km: vehicle.included_km,
      extra_km_price: vehicle.extra_km_price,
      unlimited_km: vehicle.unlimited_km,
      deductible_insurance_selected: input.deductible_insurance_selected || false,
      deductible_insurance_price: deductibleInsuranceAmount,
      original_deductible: 5000,
      renter_first_name: sanitizeString(input.renter_first_name, 100),
      renter_last_name: sanitizeString(input.renter_last_name, 100),
      renter_birth_date: input.renter_birth_date || null,
      renter_address: sanitizedAddress,
      renter_postal_code: sanitizedPostalCode,
      renter_city: sanitizedCity,
      renter_license_number: sanitizedLicenseNumber,
      renter_license_issue_date: input.renter_license_issue_date || null,
      renter_license_country: sanitizedLicenseCountry,
      pickup_time: input.pickup_time || null,
      dropoff_time: input.dropoff_time || null,
      has_extra_driver: input.has_extra_driver || false,
      extra_driver_first_name: input.has_extra_driver ? sanitizeString(input.extra_driver_first_name, 100) : null,
      extra_driver_last_name: input.has_extra_driver ? sanitizeString(input.extra_driver_last_name, 100) : null,
      extra_driver_birth_date: input.has_extra_driver ? input.extra_driver_birth_date : null,
      extra_driver_license_number: input.has_extra_driver ? sanitizeString(input.extra_driver_license_number, 50) : null,
      extra_driver_license_issue_date: input.has_extra_driver ? input.extra_driver_license_issue_date : null,
      extra_driver_license_country: input.has_extra_driver ? sanitizeString(input.extra_driver_license_country, 50) : null,
    };

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert(bookingData)
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking creation error:", bookingError);
      return new Response(
        JSON.stringify({ error: "Failed to create booking", details: bookingError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create deductible insurance record if selected
    if (input.deductible_insurance_selected && deductibleInsuranceAmount > 0) {
      await supabase.from("deductible_insurance").insert({
        booking_id: booking.id,
        days_covered: days,
        daily_rate: 49,
        total_amount: deductibleInsuranceAmount,
        original_deductible: 5000,
        new_deductible: 0,
        status: 'active',
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        booking_id: booking.id,
        total_price: totalPrice,
        message: "Booking created successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
