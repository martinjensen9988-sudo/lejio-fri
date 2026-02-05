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

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-REMINDER] ${step}${detailsStr}`);
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate CRON_SECRET for authorization
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

    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find professional users whose trial ends in 3 days
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    logStep("Checking for trials ending in 3 days", { 
      start: threeDaysStart.toISOString(), 
      end: threeDaysEnd.toISOString() 
    });

    const { data: usersWithExpiringTrial, error: queryError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name, trial_ends_at')
      .eq('user_type', 'professionel')
      .eq('subscription_status', 'trial')
      .gte('trial_ends_at', threeDaysStart.toISOString())
      .lte('trial_ends_at', threeDaysEnd.toISOString());

    if (queryError) {
      logStep("Error fetching users", queryError);
      throw new Error('Could not fetch users with expiring trials');
    }

    if (!usersWithExpiringTrial || usersWithExpiringTrial.length === 0) {
      logStep("No expiring trials found");
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No expiring trials', 
        emailsSent: 0 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep(`Found ${usersWithExpiringTrial.length} users with expiring trials`);

    // Check SMTP configuration
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
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    let emailsSent = 0;

    for (const user of usersWithExpiringTrial) {
      const safeName = escapeHtml(user.full_name || user.company_name || 'Udlejer');
      const trialEndDate = new Date(user.trial_ends_at);
      const formattedDate = trialEndDate.toLocaleDateString('da-DK', { 
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
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2962FF, #00E676); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .warning-box { background: #FFF8E1; padding: 20px; border-radius: 12px; border-left: 4px solid #FFD600; margin: 20px 0; }
    .warning-title { color: #F57C00; font-weight: bold; font-size: 18px; margin-bottom: 10px; }
    .features-box { background: white; padding: 20px; border-radius: 12px; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .feature-item { display: flex; align-items: center; padding: 8px 0; }
    .feature-check { color: #00E676; margin-right: 10px; font-weight: bold; }
    .cta { text-align: center; margin: 25px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2962FF, #00E676); color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .pricing { text-align: center; margin: 20px 0; }
    .price { font-size: 32px; font-weight: bold; color: #2962FF; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Din prøveperiode udløber snart</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      
      <div class="warning-box">
        <div class="warning-title">⚠️ 3 dage tilbage af din prøveperiode</div>
        <p style="margin: 0;">Din gratis prøveperiode udløber den <strong>${formattedDate}</strong>.</p>
        <p style="margin: 10px 0 0 0;">Når prøveperioden udløber, vil dine køretøjer ikke længere være synlige for lejere, og du kan ikke oprette nye bookinger.</p>
      </div>

      <p>For at fortsætte med at bruge LEJIO Pro og modtage bookinger, skal du vælge et abonnement:</p>

      <div class="features-box">
        <h4 style="margin-top: 0;">Det får du med LEJIO Pro:</h4>
        <div class="feature-item"><span class="feature-check">✓</span> Synlige køretøjer på markedspladsen</div>
        <div class="feature-item"><span class="feature-check">✓</span> Ubegrænsede bookinger</div>
        <div class="feature-item"><span class="feature-check">✓</span> Automatiske lejekontrakter</div>
        <div class="feature-item"><span class="feature-check">✓</span> Dashboard & statistik</div>
        <div class="feature-item"><span class="feature-check">✓</span> Ingen bindingsperiode</div>
      </div>

      <div class="pricing">
        <p style="margin-bottom: 5px;">Abonnement starter fra kun</p>
        <span class="price">299 kr/md</span>
      </div>

      <div class="cta">
        <a href="https://lejio.dk/settings?tab=subscription">Aktivér abonnement nu</a>
      </div>

      <p style="text-align: center; color: #666; font-size: 14px;">
        Ingen binding - annuller når som helst
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
          subject: `⏰ Din LEJIO prøveperiode udløber om 3 dage`,
          content: emailHtml,
          html: emailHtml,
        });
        emailsSent++;
        logStep(`Reminder sent to ${user.email}`);
      } catch (emailError) {
        logStep(`Failed to send email to ${user.email}`, emailError);
      }
    }

    await client.close();

    logStep(`Trial reminders sent: ${emailsSent}/${usersWithExpiringTrial.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent,
      totalUsers: usersWithExpiringTrial.length 
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
