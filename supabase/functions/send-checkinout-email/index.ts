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

interface CheckInOutEmailRequest {
  bookingId: string;
  recordType: 'check_in' | 'check_out';
  odometerReading: number;
  fuelPercent: number;
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

    const { bookingId, recordType, odometerReading, fuelPercent }: CheckInOutEmailRequest = await req.json();

    console.log(`[CHECKINOUT-EMAIL] Sending ${recordType} email for booking: ${bookingId}`);

    // Fetch booking with vehicle details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        vehicles:vehicle_id (make, model, registration)
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

    const renterEmail = booking.renter_email;
    const renterName = booking.renter_name || booking.renter_first_name || 'Lejer';
    
    if (!renterEmail) {
      console.log('[CHECKINOUT-EMAIL] No renter email found');
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
      console.log("[CHECKINOUT-EMAIL] SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const safeName = escapeHtml(renterName);
    const vehicleName = `${booking.vehicles?.make || ''} ${booking.vehicles?.model || ''}`.trim() || 'Køretøj';
    const safeVehicle = escapeHtml(vehicleName);
    const safeReg = escapeHtml(booking.vehicles?.registration || '');
    const isCheckIn = recordType === 'check_in';
    const dateTime = new Date().toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    .header { background: linear-gradient(135deg, ${isCheckIn ? '#2962FF, #00E676' : '#FF6B35, #F7C548'}); padding: 40px 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px; }
    .content { padding: 30px; }
    .info-card { background: #f8f9fa; border-radius: 16px; padding: 25px; margin: 20px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e9ecef; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-size: 14px; }
    .info-value { color: #333; font-weight: 600; font-size: 14px; }
    .status-box { background: ${isCheckIn ? 'linear-gradient(135deg, #d4edda, #c3e6cb)' : 'linear-gradient(135deg, #fff3cd, #ffeeba)'}; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
    .status-box h3 { margin: 0; color: ${isCheckIn ? '#155724' : '#856404'}; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; }
    .footer p { margin: 5px 0; font-size: 12px; color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${isCheckIn ? '🔑 Bil udleveret' : '🏁 Bil afleveret'}</h1>
      <p>${isCheckIn ? 'Din lejeperiode er nu startet' : 'Din lejeperiode er nu afsluttet'}</p>
    </div>
    
    <div class="content">
      <p>Hej ${safeName},</p>
      <p>${isCheckIn 
        ? `Din leje af <strong>${safeVehicle}</strong> (${safeReg}) er nu registreret som startet.`
        : `Din leje af <strong>${safeVehicle}</strong> (${safeReg}) er nu registreret som afsluttet.`
      }</p>

      <div class="info-card">
        <h3 style="margin: 0 0 15px; color: #2962FF;">${isCheckIn ? '📋 Udleverings-info' : '📋 Afleverings-info'}</h3>
        
        <div class="info-row">
          <span class="info-label">Tidspunkt</span>
          <span class="info-value">${dateTime}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Køretøj</span>
          <span class="info-value">${safeVehicle}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Registreringsnummer</span>
          <span class="info-value">${safeReg}</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Km-stand</span>
          <span class="info-value">${odometerReading.toLocaleString('da-DK')} km</span>
        </div>
        
        <div class="info-row">
          <span class="info-label">Brændstofniveau</span>
          <span class="info-value">${fuelPercent}%</span>
        </div>
      </div>

      <div class="status-box">
        <h3>${isCheckIn ? '✅ Kør forsigtigt!' : '✅ Tak for leje!'}</h3>
        <p style="margin: 10px 0 0; font-size: 14px; color: ${isCheckIn ? '#155724' : '#856404'};">
          ${isCheckIn 
            ? 'Husk at kontakte udlejer ved eventuelle skader eller problemer.' 
            : 'Vi håber du havde en god oplevelse. Du vil modtage en afregning snarest.'
          }
        </p>
      </div>

      ${!isCheckIn ? `
      <p style="font-size: 14px; color: #666;">
        <strong>Bemærk:</strong> Evt. ekstra opkrævninger for km-overskridelse eller brændstof vil blive afregnet separat.
      </p>
      ` : ''}
    </div>

    <div class="footer">
      <p><strong>LEJIO</strong> - Biludlejning gjort nemt</p>
      <p>Har du spørgsmål? Kontakt din udlejer direkte via platformen.</p>
      <p>© ${new Date().getFullYear()} LEJIO</p>
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
      subject: isCheckIn 
        ? `🔑 Bil udleveret - ${safeVehicle}` 
        : `🏁 Bil afleveret - ${safeVehicle}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log(`[CHECKINOUT-EMAIL] Sent ${recordType} email to ${renterEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[CHECKINOUT-EMAIL] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
