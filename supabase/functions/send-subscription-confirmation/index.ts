import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

interface SubscriptionConfirmationRequest {
  email: string;
  companyName: string;
  fullName: string | null;
  tier: 'starter' | 'standard' | 'enterprise';
  amount: number;
  subscriptionStartDate: string;
  nextBillingDate: string;
}

const TIER_INFO = {
  starter: {
    name: "LEJIO Pro - Starter",
    maxVehicles: 5,
    price: 299,
  },
  standard: {
    name: "LEJIO Pro - Standard",
    maxVehicles: 15,
    price: 499,
  },
  enterprise: {
    name: "LEJIO Pro - Enterprise",
    maxVehicles: "35",
    price: 899,
  },
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-SUBSCRIPTION-CONFIRMATION] ${step}${detailsStr}`);
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const data: SubscriptionConfirmationRequest = await req.json();
    logStep("Received data", { email: data.email, tier: data.tier });

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      logStep("ERROR: Missing SMTP configuration");
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

    const tierInfo = TIER_INFO[data.tier];
    const safeCompanyName = escapeHtml(data.companyName);
    const safeFullName = escapeHtml(data.fullName);
    const displayName = safeFullName || safeCompanyName;
    
    const invoiceNumber = `LEJ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const invoiceDate = new Date().toLocaleDateString('da-DK', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px; }
    .content { background: white; padding: 35px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .success-icon { font-size: 48px; margin-bottom: 10px; }
    .welcome-box { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
    .welcome-box h2 { color: #2E7D32; margin: 0 0 10px 0; }
    .subscription-card { background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0; border: 2px solid #2962FF; }
    .subscription-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e0e0e0; }
    .plan-name { font-size: 20px; font-weight: bold; color: #2962FF; }
    .plan-badge { background: #2962FF; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .plan-details { display: grid; gap: 12px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .detail-label { color: #666; }
    .detail-value { font-weight: 600; color: #333; }
    .invoice-box { background: #fff; border: 1px solid #e0e0e0; border-radius: 12px; margin: 25px 0; overflow: hidden; }
    .invoice-header { background: #333; color: white; padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; }
    .invoice-header h3 { margin: 0; font-size: 18px; }
    .invoice-number { font-family: monospace; background: rgba(255,255,255,0.2); padding: 5px 12px; border-radius: 4px; }
    .invoice-body { padding: 25px; }
    .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .invoice-row:last-child { border-bottom: none; }
    .invoice-total { background: #f8f9fa; margin: 20px -25px -25px; padding: 20px 25px; display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; }
    .invoice-total .amount { color: #00E676; }
    .features-box { background: linear-gradient(135deg, #FFF8E1, #FFECB3); padding: 25px; border-radius: 12px; margin: 25px 0; }
    .features-box h3 { color: #F57C00; margin: 0 0 15px 0; }
    .feature-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; }
    .feature-check { color: #00E676; font-size: 18px; }
    .cta-button { display: block; background: linear-gradient(135deg, #FFD600, #FF8A65); color: #333; text-decoration: none; padding: 18px 35px; border-radius: 30px; font-weight: bold; font-size: 16px; text-align: center; margin: 30px 0; box-shadow: 0 4px 15px rgba(255, 214, 0, 0.4); }
    .info-box { background: #E3F2FD; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #2962FF; }
    .info-box h4 { color: #1565C0; margin: 0 0 10px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
    .footer a { color: #2962FF; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="success-icon">🎉</div>
      <h1>Velkommen til LEJIO Pro!</h1>
      <p>Dit abonnement er nu aktivt</p>
    </div>
    <div class="content">
      <div class="welcome-box">
        <h2>Hej ${displayName}!</h2>
        <p>Tak fordi du valgte LEJIO Pro. Din konto er nu opgraderet og klar til brug.</p>
      </div>

      <div class="subscription-card">
        <div class="subscription-header">
          <span class="plan-name">${tierInfo.name}</span>
          <span class="plan-badge">AKTIV</span>
        </div>
        <div class="plan-details">
          <div class="detail-row">
            <span class="detail-label">Maks antal biler:</span>
            <span class="detail-value">${tierInfo.maxVehicles} biler</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Månedlig pris:</span>
            <span class="detail-value">${tierInfo.price} kr/md</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Startdato:</span>
            <span class="detail-value">${escapeHtml(data.subscriptionStartDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Næste fakturering:</span>
            <span class="detail-value">${escapeHtml(data.nextBillingDate)}</span>
          </div>
        </div>
      </div>

      <div class="invoice-box">
        <div class="invoice-header">
          <h3>📋 Faktura</h3>
          <span class="invoice-number">${invoiceNumber}</span>
        </div>
        <div class="invoice-body">
          <div class="invoice-row">
            <span>Fakturadato:</span>
            <span>${invoiceDate}</span>
          </div>
          <div class="invoice-row">
            <span>Virksomhed:</span>
            <span>${safeCompanyName}</span>
          </div>
          <div class="invoice-row">
            <span>Beskrivelse:</span>
            <span>${tierInfo.name} - Månedligt abonnement</span>
          </div>
          <div class="invoice-row">
            <span>Periode:</span>
            <span>${escapeHtml(data.subscriptionStartDate)} - ${escapeHtml(data.nextBillingDate)}</span>
          </div>
          <div class="invoice-total">
            <span>Total (inkl. moms):</span>
            <span class="amount">${tierInfo.price} kr</span>
          </div>
        </div>
      </div>

      <div class="features-box">
        <h3>✨ Hvad du får med Pro:</h3>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Ubegrænsede bookinger og kontrakter</span>
        </div>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Dine biler synlige på søgesiden</span>
        </div>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Automatisk kontraktgenerering med digital signatur</span>
        </div>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Skaderegistrering med fotos</span>
        </div>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Booking-kalender og overblik</span>
        </div>
        <div class="feature-item">
          <span class="feature-check">✓</span>
          <span>Prioriteret kundesupport</span>
        </div>
      </div>

      <a href="https://lejio.dk/dashboard" class="cta-button">
        🚀 Gå til dit dashboard
      </a>

      <div class="info-box">
        <h4>💳 Administrer dit abonnement</h4>
        <p style="margin: 0;">Du kan til enhver tid ændre eller opsige dit abonnement via dine indstillinger på LEJIO. Gå til <strong>Indstillinger → Abonnement</strong> for at administrere din konto.</p>
      </div>

      <div class="footer">
        <p><strong>LEJIO ApS</strong></p>
        <p>Denne email er din kvittering for abonnementsaktivering.</p>
        <p>Har du spørgsmål? <a href="mailto:support@lejio.dk">support@lejio.dk</a></p>
        <p style="margin-top: 15px; font-size: 11px; color: #aaa;">
          Du modtager denne email fordi du har aktiveret et Pro-abonnement på lejio.dk
        </p>
      </div>
    </div>
  </div>
</body>
</html>
    `;

    await client.send({
      from: smtpFromEmail,
      to: data.email,
      subject: `🎉 Velkommen til LEJIO Pro - Dit abonnement er aktiveret`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    logStep("Email sent successfully", { email: data.email });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
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
