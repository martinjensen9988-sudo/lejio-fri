import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS/injection
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface BookingNotificationRequest {
  lessorEmail: string;
  lessorName: string;
  renterName: string;
  renterEmail: string;
  renterPhone: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleRegistration: string;
  startDate: string;
  endDate: string;
  totalPrice: number;
  notes?: string;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const data: BookingNotificationRequest = await req.json();
    console.log("Received booking notification request:", data);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.error("Missing SMTP configuration");
      throw new Error("SMTP configuration is incomplete");
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Escape all user-provided data
    const safeLessorName = escapeHtml(data.lessorName);
    const safeRenterName = escapeHtml(data.renterName);
    const safeRenterEmail = escapeHtml(data.renterEmail);
    const safeRenterPhone = escapeHtml(data.renterPhone);
    const safeVehicleMake = escapeHtml(data.vehicleMake);
    const safeVehicleModel = escapeHtml(data.vehicleModel);
    const safeVehicleRegistration = escapeHtml(data.vehicleRegistration);
    const safeStartDate = escapeHtml(data.startDate);
    const safeEndDate = escapeHtml(data.endDate);
    const safeNotes = escapeHtml(data.notes);

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #666; font-weight: 500; }
    .value { color: #333; font-weight: 600; }
    .price { font-size: 24px; color: #2962FF; font-weight: bold; text-align: center; padding: 20px; }
    .cta { text-align: center; margin-top: 20px; }
    .cta a { background: #2962FF; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚗 Ny bookingforespørgsel!</h1>
    </div>
    <div class="content">
      <p>Hej ${safeLessorName},</p>
      <p>Du har modtaget en ny bookingforespørgsel på LEJIO!</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2962FF;">📋 Lejer information</h3>
        <div class="info-row">
          <span class="label">Navn:</span>
          <span class="value">${safeRenterName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${safeRenterEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">Telefon:</span>
          <span class="value">${safeRenterPhone}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #2962FF;">🚙 Køretøj</h3>
        <div class="info-row">
          <span class="label">Bil:</span>
          <span class="value">${safeVehicleMake} ${safeVehicleModel}</span>
        </div>
        <div class="info-row">
          <span class="label">Registrering:</span>
          <span class="value">${safeVehicleRegistration}</span>
        </div>
      </div>

      <div class="info-box">
        <h3 style="margin-top: 0; color: #2962FF;">📅 Periode</h3>
        <div class="info-row">
          <span class="label">Fra:</span>
          <span class="value">${safeStartDate}</span>
        </div>
        <div class="info-row">
          <span class="label">Til:</span>
          <span class="value">${safeEndDate}</span>
        </div>
      </div>

      ${safeNotes ? `
      <div class="info-box">
        <h3 style="margin-top: 0; color: #2962FF;">📝 Noter</h3>
        <p style="margin: 0;">${safeNotes}</p>
      </div>
      ` : ''}

      <div class="price">
        Total: ${data.totalPrice.toLocaleString('da-DK')} kr
      </div>

      <div class="cta">
        <a href="https://lejio.dk/dashboard">Se booking i dashboard</a>
      </div>

      <div class="footer">
        <p>Denne email er sendt automatisk fra LEJIO</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await client.send({
      from: smtpFromEmail,
      to: data.lessorEmail,
      subject: `Ny bookingforespørgsel: ${safeVehicleMake} ${safeVehicleModel}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log("Email sent successfully to:", data.lessorEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending booking notification:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
