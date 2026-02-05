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

interface PaymentReminderRequest {
  lessorId?: string; // If provided, send to specific lessor
  sendToAll?: boolean; // If true, send to all lessors with pending fees
}

interface LessorWithFees {
  id: string;
  email: string;
  full_name: string;
  fees: Array<{
    id: string;
    amount: number;
    created_at: string;
  }>;
  totalAmount: number;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Validate authorization - supports both CRON_SECRET and JWT with super_admin role
    const authHeader = req.headers.get("Authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    
    if (!cronSecret) {
      console.error("CRON_SECRET not configured");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    let isAuthorized = false;
    
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      
      // Check if it's the CRON_SECRET (for scheduled jobs)
      if (token === cronSecret) {
        isAuthorized = true;
        console.log("Authorized via CRON_SECRET");
      } else {
        // Validate JWT and check for super_admin role
        const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
        
        if (!userError && userData.user) {
          // Check if user has super_admin role
          const { data: hasRole } = await supabaseClient.rpc('has_role', {
            _user_id: userData.user.id,
            _role: 'super_admin'
          });
          
          if (hasRole) {
            isAuthorized = true;
            console.log(`Authorized via JWT - super_admin user: ${userData.user.email}`);
          }
        }
      }
    }
    
    if (!isAuthorized) {
      console.error("Unauthorized: Invalid credentials or insufficient permissions");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = supabaseClient;

    const { lessorId, sendToAll }: PaymentReminderRequest = await req.json();

    console.log(`Payment reminder request: lessorId=${lessorId}, sendToAll=${sendToAll}`);

    // Get pending fees
    let query = supabase
      .from('platform_fees')
      .select(`
        id,
        amount,
        created_at,
        lessor_id
      `)
      .eq('status', 'pending');

    if (lessorId) {
      query = query.eq('lessor_id', lessorId);
    }

    const { data: fees, error: feesError } = await query;

    if (feesError) {
      console.error('Error fetching fees:', feesError);
      throw new Error('Could not fetch pending fees');
    }

    if (!fees || fees.length === 0) {
      console.log('No pending fees found');
      return new Response(JSON.stringify({ success: true, message: 'No pending fees' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group fees by lessor
    const lessorIds = [...new Set(fees.map(f => f.lessor_id))];
    
    // Get lessor profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', lessorIds);

    if (profilesError || !profiles) {
      console.error('Error fetching profiles:', profilesError);
      throw new Error('Could not fetch lessor profiles');
    }

    // Build lessors with their fees
    const lessorsWithFees: LessorWithFees[] = profiles.map(profile => {
      const lessorFees = fees.filter(f => f.lessor_id === profile.id);
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || 'Udlejer',
        fees: lessorFees,
        totalAmount: lessorFees.reduce((sum, f) => sum + f.amount, 0),
      };
    });

    // Check SMTP configuration
    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.log("SMTP not configured");
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

    for (const lessor of lessorsWithFees) {
      const safeName = escapeHtml(lessor.full_name);
      const feeCount = lessor.fees.length;
      
      const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #FF8A65, #FFD600); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: #333; margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
    .amount-box { background: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .amount { font-size: 36px; color: #FF8A65; font-weight: bold; }
    .fees-list { background: white; padding: 15px 20px; border-radius: 8px; margin: 15px 0; }
    .fee-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .fee-row:last-child { border-bottom: none; }
    .cta { text-align: center; margin: 25px 0; }
    .cta a { display: inline-block; background: linear-gradient(135deg, #2962FF, #00E676); color: white; padding: 14px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px; }
    .info-box { background: #FFF8E1; padding: 15px 20px; border-radius: 8px; border-left: 4px solid #FFD600; margin: 20px 0; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💳 Betalingspåmindelse</h1>
    </div>
    <div class="content">
      <p>Hej ${safeName},</p>
      <p>Du har ${feeCount} afventende platform gebyr${feeCount > 1 ? 'er' : ''} som skal betales.</p>
      
      <div class="amount-box">
        <p style="margin: 0 0 10px 0; color: #666;">Samlet beløb:</p>
        <p class="amount">${lessor.totalAmount.toLocaleString('da-DK')} kr</p>
      </div>

      <div class="fees-list">
        <h4 style="margin: 0 0 10px 0; color: #333;">Gebyroversigt:</h4>
        ${lessor.fees.map(fee => {
          const date = new Date(fee.created_at).toLocaleDateString('da-DK');
          return `
            <div class="fee-row">
              <span>Booking gebyr (${date})</span>
              <span style="font-weight: 600;">${fee.amount} kr</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="cta">
        <a href="https://lejio.dk/dashboard">Betal nu med kort</a>
      </div>

      <div class="info-box">
        <strong>💡 Husk:</strong> Du kan nemt betale alle gebyrer på én gang direkte fra dit dashboard.
      </div>

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
          to: lessor.email,
          subject: `💳 Betalingspåmindelse: ${lessor.totalAmount} kr afventer`,
          content: emailHtml,
          html: emailHtml,
        });
        emailsSent++;
        console.log(`Reminder sent to ${lessor.email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${lessor.email}:`, emailError);
      }
    }

    await client.close();

    console.log(`Payment reminders sent: ${emailsSent}/${lessorsWithFees.length}`);

    return new Response(JSON.stringify({ 
      success: true, 
      emailsSent,
      totalLessors: lessorsWithFees.length 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment reminders:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
