import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[APPEAL-DECISION] ${step}${detailsStr}`);
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface AppealDecisionRequest {
  appellantEmail: string;
  appellantName?: string;
  warningReason: string;
  decision: 'approved' | 'rejected';
  adminNotes?: string;
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

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { appellantEmail, appellantName, warningReason, decision, adminNotes }: AppealDecisionRequest = await req.json();

    if (!appellantEmail || !warningReason || !decision) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("Processing appeal decision", { email: appellantEmail, decision });

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

    const safeName = escapeHtml(appellantName) || 'Lejer';
    const reasonLabel = REASON_LABELS[warningReason] || escapeHtml(warningReason);
    const safeNotes = escapeHtml(adminNotes);

    const isApproved = decision === 'approved';
    const statusColor = isApproved ? '#00E676' : '#FF5252';
    const statusIcon = isApproved ? '✅' : '❌';
    const statusText = isApproved ? 'Godkendt' : 'Afvist';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2962FF, ${statusColor}); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .status-box { background: white; padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; border-left: 5px solid ${statusColor}; }
    .status-icon { font-size: 48px; }
    .status-text { font-size: 24px; font-weight: bold; color: ${statusColor}; margin: 10px 0; }
    .info-box { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; }
    .admin-notes { background: #FFF8E1; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #FFD600; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${statusIcon} Afgørelse på din klage</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      
      <p>Vi har nu behandlet din klage vedrørende advarslen for <strong>"${reasonLabel}"</strong>.</p>

      <div class="status-box">
        <div class="status-icon">${statusIcon}</div>
        <div class="status-text">Din klage er ${statusText.toLowerCase()}</div>
      </div>

      ${isApproved ? `
      <div class="info-box">
        <h4 style="margin-top: 0; color: #00E676;">✅ Hvad betyder dette?</h4>
        <p>Din klage er blevet godkendt, og advarslen er fjernet fra din profil. Du kan nu fortsætte med at leje køretøjer som normalt.</p>
      </div>
      ` : `
      <div class="info-box">
        <h4 style="margin-top: 0; color: #FF5252;">❌ Hvad betyder dette?</h4>
        <p>Efter en grundig gennemgang har vi besluttet at fastholde advarslen. Advarslen vil forblive på din profil og være synlig for udlejere.</p>
      </div>
      `}

      ${safeNotes ? `
      <div class="admin-notes">
        <strong>📝 Begrundelse fra LEJIO:</strong>
        <p style="margin-bottom: 0;">${safeNotes}</p>
      </div>
      ` : ''}

      <p>Har du spørgsmål til afgørelsen, er du velkommen til at kontakte vores support.</p>

      <div class="footer">
        <p>Med venlig hilsen,<br>LEJIO Support Team</p>
        <p>Har du spørgsmål? Kontakt os på support@lejio.dk</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await client.send({
      from: smtpFromEmail,
      to: appellantEmail,
      subject: `${statusIcon} Din LEJIO klage er blevet ${statusText.toLowerCase()}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    logStep(`Appeal decision email sent to ${appellantEmail}`, { decision });

    return new Response(JSON.stringify({ success: true }), {
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
