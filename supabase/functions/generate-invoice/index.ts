import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvoiceRequest {
  bookingId: string;
  includeVat?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new Error("Unauthorized");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { bookingId, includeVat = true }: InvoiceRequest = await req.json();

    console.log(`[INVOICE] Generating invoice for booking: ${bookingId}`);

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        vehicles:vehicle_id (
          make,
          model,
          registration
        )
      `)
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Verify lessor owns this booking
    if (booking.lessor_id !== userData.user.id) {
      throw new Error("Unauthorized");
    }

    // Get lessor profile
    const { data: lessorProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", booking.lessor_id)
      .single();

    // Generate invoice number using UUID (fallback hvis RPC fejler)
    let invoiceNumber: string;
    try {
      const { data, error } = await supabase.rpc("generate_invoice_number");
      if (error || !data) {
        // Fallback: generate invoice number manually
        invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      } else {
        invoiceNumber = data;
      }
    } catch (err) {
      // Fallback til manual nummer generering
      invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    }

    // Calculate line items
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Udregn selvrisiko-forsikring (max 49 kr/dag, max 400 kr/md) - hvis kolonne eksisterer
    let insuranceFee = 0;
    let insuranceDays = 0;
    if (booking.deductible_insurance_selected && booking.deductible_insurance_price > 0) {
      // Beregn antal dage og måneder
      insuranceDays = days;
      const months = Math.ceil(insuranceDays / 30);
      const rawPrice = insuranceDays * 49;
      const cappedPrice = Math.min(rawPrice, months * 400);
      insuranceFee = Math.min(booking.deductible_insurance_price, cappedPrice);
    }

    // Udlejers lejeindtægt ekskl. forsikring
    const lessorRentalIncome = booking.total_price - insuranceFee;
    const dailyPrice = lessorRentalIncome / days;

    interface InvoiceLineItem {
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      total: number;
      platform_fee?: boolean;
    }

    const lineItems: InvoiceLineItem[] = [
      {
        description: `Leje af ${booking.vehicles?.[0]?.make || 'Køretøj'} ${booking.vehicles?.[0]?.model || ''} (${booking.vehicles?.[0]?.registration || 'N/A'})`,
        quantity: days,
        unit: "dage",
        unit_price: dailyPrice,
        total: lessorRentalIncome,
      }
    ];

    // Tilføj selvrisiko-forsikring som særskilt line item (Lejio’s andel)
    if (insuranceFee > 0) {
      lineItems.push({
        description: "Nul selvrisiko-forsikring (Lejio)",
        quantity: insuranceDays,
        unit: "dage",
        unit_price: Math.round((insuranceFee / insuranceDays) * 100) / 100,
        total: insuranceFee,
        platform_fee: true
      });
    }

    // Add fuel fee if applicable
    if (booking.fuel_fee && booking.fuel_fee > 0) {
      lineItems.push({
        description: "Brændstofgebyr",
        quantity: 1,
        unit: "stk",
        unit_price: booking.fuel_fee,
        total: booking.fuel_fee,
      });
    }

    // Udlejers subtotal er kun lejeindtægt + evt. brændstof, ikke forsikring
    const lessorSubtotal = lineItems
      .filter(item => !item.platform_fee)
      .reduce((sum, item) => sum + item.total, 0);
    const vatAmount = includeVat ? lessorSubtotal * 0.25 : 0;
    const totalAmount = lessorSubtotal + vatAmount;

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: invoiceNumber,
        lessor_id: booking.lessor_id,
        booking_id: bookingId,
        renter_email: booking.renter_email || '',
        renter_name: booking.renter_name || (booking.renter_first_name || '') + ' ' + (booking.renter_last_name || ''),
        renter_address: booking.renter_address || null,
        subtotal: lessorSubtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: "issued",
        issued_at: new Date().toISOString(),
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        line_items: lineItems,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("[INVOICE] Error creating invoice:", invoiceError);
      throw invoiceError;
    }

    console.log(`[INVOICE] Created invoice: ${invoice.invoice_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[INVOICE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
