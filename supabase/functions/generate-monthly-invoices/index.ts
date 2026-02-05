import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MONTHLY-INVOICES] ${step}${detailsStr}`);
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

// Get subscription tier price based on vehicle count
function getSubscriptionPrice(vehicleCount: number): number {
  if (vehicleCount <= 5) return 299;
  if (vehicleCount <= 15) return 499;
  return 799;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET for security
    const cronSecret = Deno.env.get('CRON_SECRET');
    const authHeader = req.headers.get('Authorization');
    const providedSecret = authHeader?.replace('Bearer ', '');
    
    if (!cronSecret || providedSecret !== cronSecret) {
      console.error('[MONTHLY-INVOICES] Unauthorized: Invalid or missing CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate for the previous month
    const now = new Date();
    const invoiceMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonth = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth(), 1);
    const endOfMonth = new Date(invoiceMonth.getFullYear(), invoiceMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const monthName = invoiceMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });
    
    logStep("Generating invoices for month", { 
      month: monthName,
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString()
    });

    // Find all Pro users (professionel) with active subscription
    const { data: proUsers, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, cvr_number, address, city, postal_code')
      .eq('user_type', 'professionel')
      .eq('subscription_status', 'active')
      .is('fleet_plan', null); // Exclude fleet users (they use commission model)

    if (usersError) {
      logStep("Error fetching pro users", usersError);
      throw new Error('Could not fetch pro users');
    }

    if (!proUsers || proUsers.length === 0) {
      logStep("No pro users found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No pro users to invoice', 
        invoicesSent: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep(`Found ${proUsers.length} pro users`);

    // Setup SMTP
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      logStep("SMTP not configured");
      return new Response(JSON.stringify({ success: false, error: 'SMTP not configured' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

    let invoicesSent = 0;
    const invoices = [];

    for (const user of proUsers) {
      // Get vehicle count for this user
      const { count: vehicleCount } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', user.id);

      // Get booking count for the month
      const { count: bookingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('lessor_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString());

      const subscriptionFee = getSubscriptionPrice(vehicleCount || 0);
      const perBookingFee = (bookingCount || 0) * 19;
      const totalAmount = subscriptionFee + perBookingFee;

      const invoiceNumber = `INV-${invoiceMonth.getFullYear()}${String(invoiceMonth.getMonth() + 1).padStart(2, '0')}-${user.id.slice(0, 8).toUpperCase()}`;

      const safeName = escapeHtml(user.company_name || user.full_name || 'Kunde');
      const safeAddress = escapeHtml(user.address || '');
      const safeCity = escapeHtml(user.city || '');
      const safePostal = escapeHtml(user.postal_code || '');
      const safeCvr = escapeHtml(user.cvr_number || '');

      const invoiceDate = new Date().toLocaleDateString('da-DK');
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('da-DK');

      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .company-info { text-align: right; }
    .invoice-details { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .invoice-table th, .invoice-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .invoice-table th { background: #f8f9fa; font-weight: 600; }
    .total-row { font-weight: bold; font-size: 18px; background: #e8f5e9 !important; }
    .payment-info { background: #E3F2FD; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📄 Faktura fra LEJIO</h1>
    </div>
    <div class="content">
      <div class="invoice-header">
        <div class="customer-info">
          <strong>${safeName}</strong><br>
          ${safeAddress ? `${safeAddress}<br>` : ''}
          ${safePostal} ${safeCity}<br>
          ${safeCvr ? `CVR: ${safeCvr}` : ''}
        </div>
        <div class="company-info">
          <strong>LEJIO ApS</strong><br>
          CVR: 12345678<br>
          support@lejio.dk
        </div>
      </div>

      <div class="invoice-details">
        <p><strong>Fakturanummer:</strong> ${invoiceNumber}</p>
        <p><strong>Fakturadato:</strong> ${invoiceDate}</p>
        <p><strong>Betalingsfrist:</strong> ${dueDate}</p>
        <p><strong>Periode:</strong> ${monthName}</p>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>Beskrivelse</th>
            <th style="text-align: right;">Antal</th>
            <th style="text-align: right;">Pris</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>LEJIO Pro abonnement (${vehicleCount || 0} køretøjer)</td>
            <td style="text-align: right;">1</td>
            <td style="text-align: right;">${subscriptionFee} kr</td>
            <td style="text-align: right;">${subscriptionFee} kr</td>
          </tr>
          ${bookingCount && bookingCount > 0 ? `
          <tr>
            <td>Booking-gebyr</td>
            <td style="text-align: right;">${bookingCount}</td>
            <td style="text-align: right;">19 kr</td>
            <td style="text-align: right;">${perBookingFee} kr</td>
          </tr>
          ` : ''}
          <tr class="total-row">
            <td colspan="3">Total ekskl. moms</td>
            <td style="text-align: right;">${totalAmount} kr</td>
          </tr>
          <tr>
            <td colspan="3">Moms (25%)</td>
            <td style="text-align: right;">${(totalAmount * 0.25).toFixed(2)} kr</td>
          </tr>
          <tr class="total-row">
            <td colspan="3">Total inkl. moms</td>
            <td style="text-align: right;">${(totalAmount * 1.25).toFixed(2)} kr</td>
          </tr>
        </tbody>
      </table>

      <div class="payment-info">
        <h4 style="margin-top: 0;">💳 Betalingsinformation</h4>
        <p><strong>Bank:</strong> Danske Bank</p>
        <p><strong>Reg.nr.:</strong> 1234</p>
        <p><strong>Kontonr.:</strong> 12345678</p>
        <p><strong>Reference:</strong> ${invoiceNumber}</p>
      </div>

      <div class="footer">
        <p>Tak for at du bruger LEJIO!</p>
        <p>Har du spørgsmål til fakturaen? Kontakt os på faktura@lejio.dk</p>
      </div>
    </div>
  </div>
</body>
</html>
      `;

      try {
        await client.send({
          from: smtpFromEmail,
          to: user.email,
          subject: `📄 LEJIO Faktura for ${monthName} - ${invoiceNumber}`,
          content: emailHtml,
          html: emailHtml,
        });
        invoicesSent++;
        invoices.push({
          email: user.email,
          invoiceNumber,
          totalAmount: totalAmount * 1.25
        });
        logStep(`Invoice sent to ${user.email}`, { invoiceNumber, totalAmount });
      } catch (emailError) {
        logStep(`Failed to send invoice to ${user.email}`, emailError);
      }
    }

    await client.close();

    logStep(`Monthly invoices completed: ${invoicesSent}`);

    return new Response(JSON.stringify({ 
      success: true, 
      invoicesSent,
      invoices
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
