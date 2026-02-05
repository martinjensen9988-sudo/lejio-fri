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

interface Settlement {
  rentalPrice: number;
  kmOverageFee: number;
  fuelFee: number;
  finesTotal: number;
  totalCharges: number;
  depositAmount: number;
  depositRefund: number;
  amountDueFromRenter: number;
}

interface Fine {
  type: string;
  amount: number;
  date: string;
}

interface SettlementEmailRequest {
  renterEmail: string;
  renterName: string;
  vehicleName: string;
  vehicleRegistration: string;
  settlement: Settlement;
  fines: Fine[];
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { renterEmail, renterName, vehicleName, vehicleRegistration, settlement, fines }: SettlementEmailRequest = await req.json();

    console.log(`[SETTLEMENT-EMAIL] Sending to ${renterEmail}`);

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL") || "noreply@lejio.dk";

    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.log("[SETTLEMENT-EMAIL] SMTP not configured");
      return new Response(
        JSON.stringify({ success: false, message: "SMTP not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fineTypeLabels: Record<string, string> = {
      parking: 'P-afgift',
      speed: 'Fartbøde',
      toll: 'Vejafgift',
      other: 'Bøde'
    };

    const safeName = escapeHtml(renterName);
    const safeVehicle = escapeHtml(vehicleName);
    const safeReg = escapeHtml(vehicleRegistration);

    // Build fines HTML if unknown
    let finesHtml = '';
    if (fines && fines.length > 0) {
      finesHtml = `
        <tr style="background-color: #fff3cd;">
          <td style="padding: 12px; border-bottom: 1px solid #eee;" colspan="2">
            <strong>⚠️ Bøder</strong>
          </td>
        </tr>
      `;
      for (const fine of fines) {
        finesHtml += `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee; padding-left: 24px;">
              ${fineTypeLabels[fine.type] || fine.type} (${fine.date})
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #dc2626;">
              ${fine.amount.toFixed(2)} kr
            </td>
          </tr>
        `;
      }
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 30px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { padding: 30px; background: #f8f9fa; }
    .card { background: white; border-radius: 12px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    table { width: 100%; border-collapse: collapse; }
    .footer { text-align: center; padding: 20px; color: #888; font-size: 12px; }
    .refund { background-color: #d1fae5; }
    .due { background-color: #fee2e2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Afregning af leje</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      <p>Din lejeperiode for <strong>${safeVehicle}</strong> (${safeReg}) er nu afsluttet. Her er din afregning:</p>
      
      <div class="card">
        <table>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Lejepris</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${settlement.rentalPrice.toFixed(2)} kr</td>
          </tr>
          ${settlement.kmOverageFee > 0 ? `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Km-overskridelse</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #dc2626;">${settlement.kmOverageFee.toFixed(2)} kr</td>
          </tr>
          ` : ''}
          ${settlement.fuelFee > 0 ? `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Brændstofgebyr</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #dc2626;">${settlement.fuelFee.toFixed(2)} kr</td>
          </tr>
          ` : ''}
          ${finesHtml}
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>Ekstra opkrævninger i alt</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;"><strong>${settlement.totalCharges.toFixed(2)} kr</strong></td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">Depositum indbetalt</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${settlement.depositAmount.toFixed(2)} kr</td>
          </tr>
          ${settlement.depositRefund > 0 ? `
          <tr class="refund">
            <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>💰 Refunderes til dig</strong></td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; color: #16a34a;"><strong>${settlement.depositRefund.toFixed(2)} kr</strong></td>
          </tr>
          ` : ''}
          ${settlement.amountDueFromRenter > 0 ? `
          <tr class="due">
            <td style="padding: 12px;"><strong>⚠️ Beløb du skylder</strong></td>
            <td style="padding: 12px; text-align: right; color: #dc2626;"><strong>${settlement.amountDueFromRenter.toFixed(2)} kr</strong></td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${settlement.depositRefund > 0 ? `
      <p>Dit depositum på <strong>${settlement.depositRefund.toFixed(2)} kr</strong> vil blive refunderet inden for 5 hverdage til den betalingsmetode, du brugte ved booking.</p>
      ` : ''}

      ${settlement.amountDueFromRenter > 0 ? `
      <p>Venligst betal det udestående beløb på <strong>${settlement.amountDueFromRenter.toFixed(2)} kr</strong> inden for 14 dage. Du vil modtage en faktura separat.</p>
      ` : ''}

      <p>Tak fordi du lejede hos os! Vi håber, du havde en god oplevelse.</p>

      <div class="footer">
        <p>LEJIO - Biludlejning gjort nemt</p>
        <p>Har du spørgsmål? Kontakt din udlejer direkte.</p>
      </div>
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
      subject: `📋 Afregning af din leje - ${safeVehicle}`,
      content: emailHtml,
      html: emailHtml,
    });

    await client.close();

    console.log(`[SETTLEMENT-EMAIL] Sent successfully to ${renterEmail}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[SETTLEMENT-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
