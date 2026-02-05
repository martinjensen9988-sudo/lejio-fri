import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface BookingPaidRequest {
  bookingId: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId }: BookingPaidRequest = await req.json();

    console.log(`[BOOKING-PAID] Sending confirmation for booking: ${bookingId}`);

    // Fetch booking with vehicle and lessor details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles:vehicle_id (make, model, registration, owner_id)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get lessor info
    const { data: lessor } = await supabase
      .from('profiles')
      .select('full_name, email, phone, company_name')
      .eq('id', booking.lessor_id)
      .single();

    const renterEmail = booking.renter_email;
    const renterName = booking.renter_name || booking.renter_first_name || 'Lejer';
    
    if (!renterEmail) {
      console.log('[BOOKING-PAID] No renter email found');
      return new Response(
        JSON.stringify({ success: false, message: 'No renter email' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.log("[BOOKING-PAID] SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeName = escapeHtml(renterName);
    const vehicleName = `${booking.vehicles?.make || ''} ${booking.vehicles?.model || ''}`.trim() || 'Køretøj';
    const safeVehicle = escapeHtml(vehicleName);
    const safeReg = escapeHtml(booking.vehicles?.registration || '');
    const lessorName = escapeHtml(lessor?.company_name || lessor?.full_name || 'Udlejer');
    const lessorPhone = escapeHtml(lessor?.phone || '');
    const lessorEmail = escapeHtml(lessor?.email || '');

    const startDate = new Date(booking.start_date).toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const endDate = new Date(booking.end_date).toLocaleDateString('da-DK', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .success-badge { background: linear-gradient(135deg, #d4edda, #c3e6cb); border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0; }
    .success-badge h2 { color: #155724; margin: 0; font-size: 20px; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-card h3 { margin: 0 0 15px; color: #2962FF; font-size: 16px; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; }
    .info-value { color: #333; font-weight: 600; font-size: 14px; text-align: right; }
    .price-total { background: linear-gradient(135deg, #2962FF, #00E676); border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .price-total p { color: rgba(255,255,255,0.9); margin: 0 0 5px; font-size: 14px; }
    .price-total h2 { color: white; margin: 0; font-size: 28px; }
    .next-steps { background: #fff3cd; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .next-steps h3 { color: #856404; margin: 0 0 15px; font-size: 16px; }
    .next-steps ol { margin: 0; padding-left: 20px; color: #856404; }
    .next-steps li { margin: 8px 0; }
    .cta { text-align: center; margin: 30px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2962FF, #00E676); color: white; padding: 15px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; }
    .lessor-info { background: #e3f2fd; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .lessor-info h3 { color: #1565c0; margin: 0 0 10px; font-size: 16px; }
    .lessor-info p { margin: 5px 0; color: #1565c0; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Booking bekræftet!</h1>
      <p>Din betaling er modtaget</p>
    </div>
    
    <div class="content">
      <div class="success-badge">
        <h2>✅ Betaling gennemført</h2>
        <p style="margin: 10px 0 0; color: #155724;">Din booking er nu bekræftet og reserveret til dig.</p>
      </div>

      <p>Hej ${safeName},</p>
      <p>Tak for din booking! Vi har modtaget din betaling, og køretøjet er nu reserveret til dig.</p>

      <div class="info-card">
        <h3>🚗 Køretøj</h3>
        <div class="info-row">
          <span class="info-label">Bil</span>
          <span class="info-value">${safeVehicle}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Registreringsnummer</span>
          <span class="info-value">${safeReg}</span>
        </div>
      </div>

      <div class="info-card">
        <h3>📅 Lejeperiode</h3>
        <div class="info-row">
          <span class="info-label">Fra</span>
          <span class="info-value">${startDate}${booking.pickup_time ? ` kl. ${booking.pickup_time}` : ''}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Til</span>
          <span class="info-value">${endDate}${booking.dropoff_time ? ` kl. ${booking.dropoff_time}` : ''}</span>
        </div>
      </div>

      <div class="price-total">
        <p>Total pris</p>
        <h2>${booking.total_price?.toLocaleString('da-DK')} kr</h2>
      </div>

      ${booking.deposit_amount && booking.deposit_amount > 0 ? `
      <div class="info-card">
        <h3>💳 Depositum</h3>
        <p style="margin: 0; color: #666;">Der er reserveret et depositum på <strong>${booking.deposit_amount.toLocaleString('da-DK')} kr</strong> på dit kort. Dette frigives efter aflevering.</p>
      </div>
      ` : ''}

      <div class="lessor-info">
        <h3>👤 Din udlejer</h3>
        <p><strong>${lessorName}</strong></p>
        ${lessorPhone ? `<p>📞 ${lessorPhone}</p>` : ''}
        ${lessorEmail ? `<p>✉️ ${lessorEmail}</p>` : ''}
      </div>

      <div class="next-steps">
        <h3>📋 Næste skridt</h3>
        <ol>
          <li>Du vil modtage en lejekontrakt til digital underskrift</li>
          <li>Mød op på den aftalte afhentningsadresse til tiden</li>
          <li>Medbring gyldigt kørekort og ID</li>
          <li>Gennemgå bilen sammen med udlejer ved afhentning</li>
        </ol>
      </div>

      <div class="cta">
        <a href="https://lejio.dk/mine-lejemal">Se din booking</a>
      </div>
    </div>

    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>© ${new Date().getFullYear()} LEJIO. Alle rettigheder forbeholdes.</p>
    </div>
  </div>
</body>
</html>
    `;

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPassword },
      },
    });

    await client.send({
      from: smtpFromEmail,
      to: renterEmail,
      subject: `🎉 Booking bekræftet - ${safeVehicle}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log(`[BOOKING-PAID] Sent confirmation to ${renterEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[BOOKING-PAID] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
