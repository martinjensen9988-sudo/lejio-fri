import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WarningNotificationRequest {
  renterEmail: string;
  renterName: string;
  warningId: string;
  reason: string;
  lessorName: string;
  appealUrl: string;
}

const REASON_LABELS: Record<string, string> = {
  damage: 'Skade på køretøj',
  non_payment: 'Manglende betaling',
  contract_violation: 'Kontraktbrud',
  fraud: 'Svindel',
  reckless_driving: 'Vanvidskørsel',
  late_return: 'Forsinket aflevering',
  cleanliness: 'Manglende rengøring',
  other: 'Anden årsag',
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

// Validate URL is on trusted domain
function isValidAppealUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const trustedDomains = ['lejio.dk', 'www.lejio.dk', 'localhost'];
    return trustedDomains.some(domain => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { renterEmail, renterName, warningId, reason, lessorName, appealUrl }: WarningNotificationRequest = await req.json();
    
    // Validate required fields
    if (!renterEmail || !warningId || !reason) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate email format
    if (!isValidEmail(renterEmail)) {
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

    const reasonLabel = REASON_LABELS[reason] || escapeHtml(reason);
    const safeRenterName = escapeHtml(renterName) || 'Lejer';
    const safeLessorName = escapeHtml(lessorName) || 'En udlejer';
    const safeAppealUrl = appealUrl && isValidAppealUrl(appealUrl) ? appealUrl : null;

    const appealLink = safeAppealUrl 
      ? `<p style="text-align: center; margin: 30px 0;">
          <a href="${safeAppealUrl}" style="display: inline-block; background: #2962FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">Indgiv klage</a>
        </p>`
      : '<p>Kontakt venligst LEJIO support for at indgive en klage.</p>';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Advarsel på din profil</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #DC2626, #EF4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">⚠️ Vigtig besked</h1>
          </div>
          <div class="content">
            <p>Kære ${safeRenterName},</p>
            
            <div class="warning-box">
              <p style="margin: 0;"><strong>En udlejer (${safeLessorName}) har oprettet en advarsel på din profil.</strong></p>
              <p style="margin: 10px 0 0 0;"><strong>Årsag:</strong> ${reasonLabel}</p>
            </div>
            
            <p>Hvis du mener, at denne advarsel er uberettiget, har du mulighed for at klage over beslutningen.</p>
            
            ${appealLink}
            
            <p>Med venlig hilsen,<br>LEJIO</p>
          </div>
          <div class="footer">
            <p>Denne email er sendt automatisk fra LEJIO</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Initialize SMTP client
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

    // Send email
    await client.send({
      from: smtpFromEmail,
      to: renterEmail,
      subject: "Vigtig besked: Der er oprettet en advarsel på din profil",
      content: "auto",
      html: emailHtml,
    });

    await client.close();

    console.log("Warning notification email sent to:", renterEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error sending warning notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
