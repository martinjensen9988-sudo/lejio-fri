import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FineNotificationRequest {
  renterEmail: string;
  renterName: string;
  lessorName: string;
  fineType: string;
  fineDate: string;
  fineAmount: number;
  adminFee: number;
  totalAmount: number;
  description?: string;
  fileUrl?: string;
  vehicleInfo?: string;
}

const FINE_TYPE_LABELS: Record<string, string> = {
  parking: "Parkeringsbøde",
  speed: "Fartbøde",
  toll: "Betalingsring/Bro",
  other: "Afgift",
};

// HTML escape function to prevent XSS
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: FineNotificationRequest = await req.json();
    
    // Validate required fields
    if (!data.renterEmail || !data.fineType || !data.totalAmount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    if (!isValidEmail(data.renterEmail)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get SMTP settings
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.error("SMTP not configured");
      return new Response(
        JSON.stringify({ error: "SMTP not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const fineTypeLabel = FINE_TYPE_LABELS[data.fineType] || escapeHtml(data.fineType);
    const safeRenterName = escapeHtml(data.renterName) || 'Lejer';
    const safeLessorName = escapeHtml(data.lessorName) || 'Udlejer';
    const safeDescription = escapeHtml(data.description);
    const safeVehicleInfo = escapeHtml(data.vehicleInfo);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bøde/Afgift - Handling Påkrævet</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
            .fine-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .fine-box h3 { margin-top: 0; color: #dc2626; }
            .fine-table { width: 100%; border-collapse: collapse; }
            .fine-table td { padding: 8px 0; }
            .fine-table .label { color: #666; }
            .fine-table .value { text-align: right; font-weight: 600; }
            .total-row { border-top: 2px solid #dc2626; }
            .total-row td { padding: 12px 0; font-size: 18px; font-weight: bold; }
            .total-amount { color: #dc2626; }
            .btn { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Bøde/Afgift Modtaget</h1>
            </div>
            
            <div class="content">
              <p style="font-size: 16px;">Hej ${safeRenterName},</p>
              
              <p>Der er registreret en <strong>${fineTypeLabel}</strong> i forbindelse med din lejeaftale.</p>
              
              <div class="fine-box">
                <h3>Bødeoplysninger</h3>
                <table class="fine-table">
                  <tr>
                    <td class="label">Type:</td>
                    <td class="value">${fineTypeLabel}</td>
                  </tr>
                  <tr>
                    <td class="label">Dato:</td>
                    <td class="value">${escapeHtml(data.fineDate)}</td>
                  </tr>
                  ${safeVehicleInfo ? `
                  <tr>
                    <td class="label">Køretøj:</td>
                    <td class="value">${safeVehicleInfo}</td>
                  </tr>
                  ` : ''}
                  ${safeDescription ? `
                  <tr>
                    <td class="label">Beskrivelse:</td>
                    <td class="value">${safeDescription}</td>
                  </tr>
                  ` : ''}
                  <tr style="border-top: 1px solid #fecaca;">
                    <td class="label">Bødebeløb:</td>
                    <td class="value">${data.fineAmount.toLocaleString('da-DK')} kr</td>
                  </tr>
                  <tr>
                    <td class="label">Administrationsgebyr:</td>
                    <td class="value">${data.adminFee.toLocaleString('da-DK')} kr</td>
                  </tr>
                  <tr class="total-row">
                    <td>Total at betale:</td>
                    <td class="value total-amount">${data.totalAmount.toLocaleString('da-DK')} kr</td>
                  </tr>
                </table>
              </div>

              ${data.fileUrl ? `
              <p style="text-align: center;">
                <a href="${escapeHtml(data.fileUrl)}" class="btn">📄 Se bøde/dokumentation</a>
              </p>
              ` : ''}

              <p style="margin-top: 20px;">Venligst betal beløbet hurtigst muligt. Ved spørgsmål kontakt udlejer: <strong>${safeLessorName}</strong></p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p class="footer">
                Denne email er sendt via LEJIO - Danmarks smarteste udlejningsplatform
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Initialize SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 587,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Send email
    await client.send({
      from: smtpFromEmail,
      to: data.renterEmail,
      subject: `⚠️ ${fineTypeLabel} - ${data.totalAmount.toLocaleString('da-DK')} kr at betale`,
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log("Fine notification email sent to:", data.renterEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error sending fine notification:", error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);