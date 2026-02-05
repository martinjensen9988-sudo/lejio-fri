import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-EXPIRATION] ${step}${detailsStr}`);
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
      console.error('[TRIAL-EXPIRATION] Unauthorized: Invalid or missing CRON_SECRET');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Find users whose trial has expired
    const { data: expiredTrialUsers, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, trial_ends_at')
      .eq('user_type', 'professionel')
      .eq('subscription_status', 'trial')
      .lt('trial_ends_at', now);

    if (queryError) {
      logStep("Error fetching expired trials", queryError);
      throw new Error('Could not fetch expired trials');
    }

    if (!expiredTrialUsers || expiredTrialUsers.length === 0) {
      logStep("No expired trials found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No expired trials', 
        usersProcessed: 0,
        vehiclesHidden: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep(`Found ${expiredTrialUsers.length} users with expired trials`);

    let usersProcessed = 0;
    let vehiclesHidden = 0;

    for (const user of expiredTrialUsers) {
      // Update user subscription status to expired
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'expired' })
        .eq('id', user.id);

      if (updateProfileError) {
        logStep(`Error updating profile for ${user.email}`, updateProfileError);
        continue;
      }

      // Hide all user's vehicles (set is_available to false)
      const { data: hiddenVehicles, error: updateVehiclesError } = await supabase
        .from('vehicles')
        .update({ is_available: false })
        .eq('owner_id', user.id)
        .eq('is_available', true)
        .select('id');

      if (updateVehiclesError) {
        logStep(`Error hiding vehicles for ${user.email}`, updateVehiclesError);
      } else {
        vehiclesHidden += hiddenVehicles?.length || 0;
      }

      usersProcessed++;
      logStep(`Processed ${user.email}`, { vehiclesHidden: hiddenVehicles?.length || 0 });
    }

    // Send expiration emails
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (smtpHost && smtpUser && smtpPassword && smtpFromEmail && usersProcessed > 0) {
      const client = new SMTPClient({
        connection: {
          hostname: smtpHost,
          port: 465,
          tls: true,
          auth: { username: smtpUser, password: smtpPassword },
        },
      });

      for (const user of expiredTrialUsers) {
        const safeName = escapeHtml(user.company_name || user.full_name || 'Udlejer');

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF5252, #FF8A65); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .warning-box { background: #FFEBEE; padding: 20px; border-radius: 12px; border-left: 4px solid #FF5252; margin: 20px 0; }
    .info-box { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .cta { text-align: center; margin: 25px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2962FF, #00E676); color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Din prøveperiode er udløbet</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      
      <div class="warning-box">
        <h4 style="margin-top: 0;">Din LEJIO Pro prøveperiode er udløbet</h4>
        <p style="margin: 0;">Dine køretøjer er nu skjult fra søgeresultaterne, og du kan ikke modtage nye bookinger.</p>
      </div>

      <div class="info-box">
        <h4 style="margin-top: 0;">🔓 Genaktiver din konto</h4>
        <p>For at få dine køretøjer synlige igen og fortsætte med at modtage bookinger, skal du aktivere et abonnement.</p>
        <ul>
          <li><strong>1-5 køretøjer:</strong> 299 kr/md</li>
          <li><strong>6-15 køretøjer:</strong> 499 kr/md</li>
          <li><strong>16+ køretøjer:</strong> 799 kr/md</li>
        </ul>
      </div>

      <div class="cta">
        <a href="https://lejio.dk/settings?tab=subscription">Aktivér abonnement nu</a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">
        Dine data er gemt sikkert - aktiver når som helst for at fortsætte
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

        try {
          await client.send({
            from: smtpFromEmail,
            to: user.email,
            subject: `⚠️ Din LEJIO prøveperiode er udløbet`,
            content: emailHtml,
            html: emailHtml,
          });
          logStep(`Expiration email sent to ${user.email}`);
        } catch (emailError) {
          logStep(`Failed to send email to ${user.email}`, emailError);
        }
      }

      await client.close();
    }

    logStep(`Trial expiration check completed`, { usersProcessed, vehiclesHidden });

    return new Response(JSON.stringify({ 
      success: true, 
      usersProcessed,
      vehiclesHidden
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
