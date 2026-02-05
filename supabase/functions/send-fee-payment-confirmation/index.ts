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

interface FeePaymentConfirmRequest {
  lessorEmail: string;
  lessorName: string;
  amount: number;
  feeCount: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET for authorization (called from webhooks/internal services)
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.error("Unauthorized: Invalid or missing CRON_SECRET");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data: FeePaymentConfirmRequest = await req.json();
    console.log("Sending fee payment confirmation to:", data.lessorEmail);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.log("SMTP not configured");
      return new Response(JSON.stringify({ success: true, message: 'SMTP not configured' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const safeName = escapeHtml(data.lessorName);
    const paymentDate = new Date().toLocaleDateString('da-DK', {
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
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #00E676, #2962FF); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .success-box { background: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); border: 2px solid #00E676; }
    .checkmark { font-size: 48px; margin-bottom: 10px; }
    .amount { font-size: 32px; color: #00E676; font-weight: bold; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .detail-row:last-child { border-bottom: none; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Betaling modtaget!</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      <p>Tak for din betaling! Vi har modtaget dit gebyr.</p>
      
      <div class="success-box">
        <div class="checkmark">✓</div>
        <p class="amount">${data.amount.toLocaleString('da-DK')} kr</p>
        <p style="color: #666; margin: 0;">Betalt</p>
      </div>

      <div class="details">
        <div class="detail-row">
          <span style="color: #666;">Betalingsdato:</span>
          <span style="font-weight: 600;">${paymentDate}</span>
        </div>
        <div class="detail-row">
          <span style="color: #666;">Antal gebyrer:</span>
          <span style="font-weight: 600;">${data.feeCount}</span>
        </div>
        <div class="detail-row">
          <span style="color: #666;">Status:</span>
          <span style="color: #00E676; font-weight: 600;">Godkendt</span>
        </div>
      </div>

      <p style="text-align: center; color: #666;">
        Du kan altid se din betalingshistorik i dit <a href="https://lejio.dk/dashboard" style="color: #2962FF;">dashboard</a>.
      </p>

      <div class="footer">
        <p>Denne email er sendt automatisk fra LEJIO</p>
        <p>Har du spørgsmål? Kontakt os på support@lejio.dk</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await client.send({
      from: smtpFromEmail,
      to: data.lessorEmail,
      subject: `✅ Betalingskvittering: ${data.amount} kr betalt`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log("Payment confirmation sent to:", data.lessorEmail);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment confirmation:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
