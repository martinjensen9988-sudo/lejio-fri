import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FLEET-SETTLEMENT] ${step}${detailsStr}`);
};

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
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
      console.error('[FLEET-SETTLEMENT] Unauthorized: Invalid or missing CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate settlement for the previous month
    const now = new Date();
    const settlementMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfMonth = new Date(settlementMonth.getFullYear(), settlementMonth.getMonth(), 1);
    const endOfMonth = new Date(settlementMonth.getFullYear(), settlementMonth.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const settlementMonthStr = settlementMonth.toISOString().slice(0, 10);
    
    logStep("Calculating settlement for month", { 
      month: settlementMonthStr,
      start: startOfMonth.toISOString(),
      end: endOfMonth.toISOString()
    });

    // Find all fleet lessors (fleet_private, fleet_basic or fleet_premium)
    const { data: fleetLessors, error: lessorsError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, fleet_plan, fleet_commission_rate')
      .in('fleet_plan', ['fleet_private', 'fleet_basic', 'fleet_premium']);

    if (lessorsError) {
      logStep("Error fetching fleet lessors", lessorsError);
      throw new Error('Could not fetch fleet lessors');
    }

    if (!fleetLessors || fleetLessors.length === 0) {
      logStep("No fleet lessors found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No fleet lessors', 
        settlementsCreated: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep(`Found ${fleetLessors.length} fleet lessors`);

    let settlementsCreated = 0;
    const settlements = [];

    for (const lessor of fleetLessors) {
      // Check if settlement already exists for this month
      const { data: existingSettlement } = await supabase
        .from('fleet_settlements')
        .select('id')
        .eq('lessor_id', lessor.id)
        .eq('settlement_month', settlementMonthStr)
        .single();

      if (existingSettlement) {
        logStep(`Settlement already exists for lessor ${lessor.email}`);
        continue;
      }

      // Get all completed bookings for this lessor in the month
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, total_price')
        .eq('lessor_id', lessor.id)
        .eq('status', 'completed')
        .gte('end_date', startOfMonth.toISOString())
        .lte('end_date', endOfMonth.toISOString());

      if (bookingsError) {
        logStep(`Error fetching bookings for ${lessor.email}`, bookingsError);
        continue;
      }

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;
      const bookingsCount = bookings?.length || 0;
      
      // Commission rate: 30% for fleet_private, 20% for fleet_basic, 35% for fleet_premium
      const commissionRate = lessor.fleet_plan === 'fleet_private' ? 0.30 : 
                              lessor.fleet_plan === 'fleet_basic' ? 0.20 : 0.35;
      const commissionAmount = totalRevenue * commissionRate;
      const netPayout = totalRevenue - commissionAmount;

      // Create settlement record
      const { data: settlement, error: settlementError } = await supabase
        .from('fleet_settlements')
        .insert({
          lessor_id: lessor.id,
          settlement_month: settlementMonthStr,
          total_revenue: totalRevenue,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          net_payout: netPayout,
          bookings_count: bookingsCount,
          status: 'pending'
        })
        .select()
        .single();

      if (settlementError) {
        logStep(`Error creating settlement for ${lessor.email}`, settlementError);
        continue;
      }

      settlementsCreated++;
      settlements.push({
        lessor: lessor.email,
        totalRevenue,
        commissionAmount,
        netPayout,
        bookingsCount
      });

      logStep(`Settlement created for ${lessor.email}`, {
        totalRevenue,
        commissionRate: commissionRate * 100 + '%',
        commissionAmount,
        netPayout
      });
    }

    // Send settlement emails
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (smtpHost && smtpUser && smtpPassword && smtpFromEmail && settlementsCreated > 0) {
      const client = new SMTPClient({
        connection: {
          hostname: smtpHost,
          port: 465,
          tls: true,
          auth: { username: smtpUser, password: smtpPassword },
        },
      });

      for (const lessor of fleetLessors) {
        const settlement = settlements.find(s => s.lessor === lessor.email);
        if (!settlement) continue;

        const safeName = escapeHtml(lessor.company_name || lessor.full_name || 'Partner');
        const monthName = settlementMonth.toLocaleDateString('da-DK', { month: 'long', year: 'numeric' });

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
    .summary-box { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: bold; }
    .total { font-size: 24px; color: #00E676; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Månedlig Fleet Afregning</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      <p>Her er din afregning for <strong>${monthName}</strong>:</p>
      
      <div class="summary-box">
        <div class="row">
          <span class="label">Antal bookinger:</span>
          <span class="value">${settlement.bookingsCount}</span>
        </div>
        <div class="row">
          <span class="label">Total omsætning:</span>
          <span class="value">${settlement.totalRevenue.toLocaleString('da-DK')} kr</span>
        </div>
        <div class="row">
          <span class="label">LEJIO kommission (${lessor.fleet_plan === 'fleet_premium' ? '10%' : '15%'}):</span>
          <span class="value">-${settlement.commissionAmount.toLocaleString('da-DK')} kr</span>
        </div>
        <div class="row">
          <span class="label">Din udbetaling:</span>
          <span class="value total">${settlement.netPayout.toLocaleString('da-DK')} kr</span>
        </div>
      </div>

      <p>Udbetalingen sker inden for 5 hverdage til din registrerede bankkonto.</p>

      <div class="footer">
        <p>LEJIO Fleet Management</p>
        <p>Har du spørgsmål? Kontakt os på fleet@lejio.dk</p>
      </div>
    </div>
  </div>
</body>
</html>
        `;

        try {
          await client.send({
            from: smtpFromEmail,
            to: lessor.email,
            subject: `📊 Din LEJIO Fleet afregning for ${monthName}`,
            content: emailHtml,
            html: emailHtml,
          });
          logStep(`Settlement email sent to ${lessor.email}`);
        } catch (emailError) {
          logStep(`Failed to send email to ${lessor.email}`, emailError);
        }
      }

      await client.close();
    }

    logStep(`Fleet settlements completed: ${settlementsCreated}`);

    return new Response(JSON.stringify({ 
      success: true, 
      settlementsCreated,
      settlements
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
