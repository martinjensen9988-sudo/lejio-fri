import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { corporate_account_id, period_start, period_end } = await req.json();

    // Validate input
    if (!corporate_account_id || !period_start || !period_end) {
      throw new Error("Missing required parameters: corporate_account_id, period_start, period_end");
    }

    // Get corporate account details
    const { data: account, error: accountError } = await supabase
      .from("corporate_accounts")
      .select("*")
      .eq("id", corporate_account_id)
      .single();

    if (accountError || !account) {
      throw new Error("Corporate account not found");
    }

    // Get all corporate bookings for the period
    const { data: corporateBookings, error: bookingsError } = await supabase
      .from("corporate_bookings")
      .select(`
        *,
        booking:booking_id (
          id,
          start_date,
          end_date,
          total_price,
          status,
          vehicle:vehicle_id (
            make,
            model,
            registration_number
          )
        ),
        employee:corporate_employee_id (
          full_name,
          department:department_id (
            name,
            cost_center_code
          )
        )
      `)
      .eq("corporate_account_id", corporate_account_id)
      .gte("created_at", period_start)
      .lte("created_at", period_end);

    if (bookingsError) {
      console.error("Error fetching bookings:", bookingsError);
      throw new Error("Failed to fetch bookings");
    }

    // Calculate totals
    let subtotal = 0;
    let totalKmDriven = 0;
    const lineItems: Record<string, unknown>[] = [];
    const departmentBreakdown: Record<string, { cost: number; bookings: number }> = {};

    for (const cb of corporateBookings || []) {
      const booking = cb.booking ;
      if (!booking || booking.status === "cancelled") continue;

      const amount = cb.cost_allocated || booking.total_price || 0;
      subtotal += amount;
      totalKmDriven += cb.km_driven || 0;

      const departmentName = cb.employee?.department?.name || "Ukendt";
      if (!departmentBreakdown[departmentName]) {
        departmentBreakdown[departmentName] = { cost: 0, bookings: 0 };
      }
      departmentBreakdown[departmentName].cost += amount;
      departmentBreakdown[departmentName].bookings += 1;

      lineItems.push({
        description: `${booking.vehicle?.make || "Køretøj"} ${booking.vehicle?.model || ""} (${booking.vehicle?.registration_number || "N/A"})`,
        employee: cb.employee?.full_name || "Ukendt medarbejder",
        department: departmentName,
        period: `${booking.start_date} - ${booking.end_date}`,
        km_driven: cb.km_driven || 0,
        amount: amount,
      });
    }

    // Calculate VAT (25% in Denmark)
    const vatRate = 0.25;
    const vatAmount = subtotal * vatRate;
    const totalAmount = subtotal + vatAmount;

    // Generate invoice number
    const { data: invoiceNumberData, error: invoiceNumberError } = await supabase.rpc(
      "generate_corporate_invoice_number"
    );

    if (invoiceNumberError) {
      console.error("Error generating invoice number:", invoiceNumberError);
      throw new Error("Failed to generate invoice number");
    }

    const invoiceNumber = invoiceNumberData;

    // Create the invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from("corporate_invoices")
      .insert({
        corporate_account_id,
        invoice_number: invoiceNumber,
        invoice_period_start: period_start,
        invoice_period_end: period_end,
        subtotal,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        total_bookings: corporateBookings?.length || 0,
        total_km_driven: totalKmDriven,
        line_items: lineItems,
        department_breakdown: departmentBreakdown,
        status: "draft",
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days
      })
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      throw new Error("Failed to create invoice");
    }

    // Update usage stats
    const periodMonth = period_start.substring(0, 7); // YYYY-MM format
    const avgUtilization = corporateBookings?.length ? (corporateBookings.length / 30) * 100 : 0;

    await supabase.from("corporate_usage_stats").upsert(
      {
        corporate_account_id,
        period_month: periodMonth,
        total_bookings: corporateBookings?.length || 0,
        total_km_driven: totalKmDriven,
        total_cost: totalAmount,
        department_stats: departmentBreakdown,
        avg_utilization_rate: Math.min(avgUtilization, 100),
      },
      {
        onConflict: "corporate_account_id,period_month",
      }
    );

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          total_amount: totalAmount,
          total_bookings: corporateBookings?.length || 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating corporate invoice:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
