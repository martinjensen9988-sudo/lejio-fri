import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Fine {
  type: string;
  amount: number;
  adminFee: number;
  total: number;
  date: string;
  description: string | null;
}

interface Settlement {
  rentalPrice: number;
  kmOverageFee: number;
  fuelFee: number;
  finesTotal: number;
  totalCharges: number;
  depositAmount: number;
  depositRefund: number;
  amountDueFromRenter: number;
  fines: Fine[];
}

interface SettlementInvoiceRequest {
  bookingId: string;
  settlement: Settlement;
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
    const { bookingId, settlement }: SettlementInvoiceRequest = await req.json();

    console.log(`[SETTLEMENT-INVOICE] Generating for booking: ${bookingId}`);

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

    // Generate invoice number
    const { data: invoiceNumber } = await supabase.rpc("generate_invoice_number");

    // Build line items
    const lineItems = [];

    // Add km overage if applicable
    if (settlement.kmOverageFee > 0) {
      lineItems.push({
        description: "Km-overskridelse",
        quantity: 1,
        unit: "stk",
        unit_price: settlement.kmOverageFee,
        total: settlement.kmOverageFee,
      });
    }

    // Add fuel fee if applicable
    if (settlement.fuelFee > 0) {
      lineItems.push({
        description: "Brændstofgebyr",
        quantity: 1,
        unit: "stk",
        unit_price: settlement.fuelFee,
        total: settlement.fuelFee,
      });
    }

    // Add fines if applicable
    for (const fine of settlement.fines || []) {
      const fineTypeLabels: Record<string, string> = {
        parking: 'P-afgift',
        speed: 'Fartbøde',
        toll: 'Vejafgift',
        other: 'Bøde'
      };
      lineItems.push({
        description: `${fineTypeLabels[fine.type] || 'Bøde'} (${fine.date})${fine.description ? ` - ${fine.description}` : ''}`,
        quantity: 1,
        unit: "stk",
        unit_price: fine.total,
        total: fine.total,
      });
    }

    // Add deposit refund as negative line item if applicable
    if (settlement.depositRefund > 0) {
      lineItems.push({
        description: "Depositum refunderet",
        quantity: 1,
        unit: "stk",
        unit_price: -settlement.depositRefund,
        total: -settlement.depositRefund,
      });
    }

    // Calculate totals
    const subtotal = settlement.totalCharges;
    const vatAmount = 0; // Settlement items typically don't include VAT
    const totalAmount = settlement.amountDueFromRenter; // What the renter still owes after deposit

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        invoice_number: `${invoiceNumber}-AFR`, // AFR = Afregning
        lessor_id: booking.lessor_id,
        booking_id: bookingId,
        renter_email: booking.renter_email,
        renter_name: booking.renter_name || `${booking.renter_first_name} ${booking.renter_last_name}`,
        renter_address: booking.renter_address,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        status: totalAmount > 0 ? "issued" : "paid", // If nothing due, mark as paid
        issued_at: new Date().toISOString(),
        due_date: totalAmount > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : null,
        line_items: lineItems,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("[SETTLEMENT-INVOICE] Error creating invoice:", invoiceError);
      throw invoiceError;
    }

    console.log(`[SETTLEMENT-INVOICE] Created invoice: ${invoice.invoice_number}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invoice 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[SETTLEMENT-INVOICE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
