import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS/injection
function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, char => 
    ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] || char
  );
}

interface CriticalActionAlert {
  action_type: string;
  entity_type: string;
  entity_identifier?: string;
  description: string;
  admin_email: string;
  admin_name?: string;
  details?: Record<string, unknown>;
  severity: 'high' | 'critical';
}

const ACTION_LABELS: Record<string, string> = {
  delete: 'Sletning',
  update: 'Opdatering',
  create: 'Oprettelse',
  swap: 'Bilbytte',
  approve: 'Godkendelse',
  reject: 'Afvisning',
};

const ENTITY_LABELS: Record<string, string> = {
  profile: 'Bruger',
  booking: 'Booking',
  vehicle: 'Køretøj',
  invoice: 'Faktura',
  vehicle_swap: 'Bilbytte',
  warning: 'Advarsel',
  user_role: 'Brugerrolle',
};

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: '#FFF3CD', text: '#856404', border: '#FFECB5' },
  critical: { bg: '#F8D7DA', text: '#721C24', border: '#F5C6CB' },
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create service role client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: CriticalActionAlert = await req.json();
    console.log("Critical action alert:", data.action_type, data.entity_type);

    // Get all super_admin users to notify
    const { data: superAdmins, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'super_admin');

    if (rolesError) {
      console.error('Error fetching super admins:', rolesError);
      throw new Error('Could not fetch super admins');
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.log('No super admins to notify');
      return new Response(JSON.stringify({ success: true, notified: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get email addresses for super admins
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', superAdmins.map(sa => sa.user_id));

    if (profilesError || !profiles || profiles.length === 0) {
      console.error('Error fetching super admin profiles:', profilesError);
      throw new Error('Could not fetch super admin profiles');
    }

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");
    const smtpFromEmail = Deno.env.get("SMTP_FROM_EMAIL");

    if (!smtpHost || !smtpUser || !smtpPassword || !smtpFromEmail) {
      console.error("Missing SMTP configuration");
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

    const severityColors = SEVERITY_COLORS[data.severity] || SEVERITY_COLORS.high;
    const actionLabel = ACTION_LABELS[data.action_type] || data.action_type;
    const entityLabel = ENTITY_LABELS[data.entity_type] || data.entity_type;
    const timestamp = new Date().toLocaleString('da-DK', { timeZone: 'Europe/Copenhagen' });

    // Build details HTML if provided
    let detailsHtml = '';
    if (data.details && Object.keys(data.details).length > 0) {
      detailsHtml = `
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <h4 style="margin: 0 0 10px 0; color: #333;">Detaljer:</h4>
          <pre style="margin: 0; font-size: 12px; overflow-x: auto; white-space: pre-wrap;">${escapeHtml(JSON.stringify(data.details, null, 2))}</pre>
        </div>
      `;
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #DC3545, #C82333); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
    .alert-box { background: ${severityColors.bg}; border: 2px solid ${severityColors.border}; padding: 20px; border-radius: 8px; margin: 15px 0; }
    .alert-title { color: ${severityColors.text}; font-weight: bold; font-size: 18px; margin: 0 0 10px 0; }
    .info-row { display: flex; margin: 8px 0; }
    .info-label { font-weight: 600; min-width: 120px; color: #555; }
    .info-value { color: #333; }
    .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; border: 1px solid #e0e0e0; border-top: none; }
    .logo { font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }
    .severity-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; background: ${severityColors.bg}; color: ${severityColors.text}; border: 1px solid ${severityColors.border}; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚠️ LEJIO ALERT</div>
      <h1>Kritisk Handling Udført</h1>
    </div>
    <div class="content">
      <div class="alert-box">
        <p class="alert-title">
          <span class="severity-badge">${data.severity === 'critical' ? '🔴 KRITISK' : '🟠 HØJ PRIORITET'}</span>
        </p>
        <p style="font-size: 16px; margin: 15px 0 0 0;">${escapeHtml(data.description)}</p>
      </div>
      
      <div style="margin: 20px 0;">
        <div class="info-row">
          <span class="info-label">Handling:</span>
          <span class="info-value">${escapeHtml(actionLabel)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${escapeHtml(entityLabel)}</span>
        </div>
        ${data.entity_identifier ? `
        <div class="info-row">
          <span class="info-label">Identifier:</span>
          <span class="info-value">${escapeHtml(data.entity_identifier)}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="info-label">Udført af:</span>
          <span class="info-value">${escapeHtml(data.admin_name || 'Ukendt')} (${escapeHtml(data.admin_email)})</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tidspunkt:</span>
          <span class="info-value">${escapeHtml(timestamp)}</span>
        </div>
      </div>
      
      ${detailsHtml}
      
      <div style="margin-top: 25px; padding: 15px; background: #e7f3ff; border-radius: 8px; border-left: 4px solid #2962FF;">
        <p style="margin: 0; color: #1a5276;">
          <strong>💡 Anbefaling:</strong> Gennemgå denne handling i <a href="https://lejio.lovable.app/admin/audit-log" style="color: #2962FF;">Audit Log</a> for at sikre, at den var autoriseret.
        </p>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0; color: #666;">
        Denne notifikation blev sendt automatisk af LEJIO's sikkerhedssystem.<br>
        Du modtager denne email fordi du er super administrator.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send to all super admins
    let notifiedCount = 0;
    for (const profile of profiles) {
      if (!profile.email) continue;
      
      try {
        await client.send({
          from: smtpFromEmail,
          to: profile.email,
          subject: `⚠️ LEJIO Alert: ${actionLabel} af ${entityLabel}${data.entity_identifier ? ` (${data.entity_identifier})` : ''}`,
          content: emailHtml,
          html: emailHtml,
        });
        notifiedCount++;
        console.log(`Alert sent to super admin: ${profile.email}`);
      } catch (sendError) {
        console.error(`Failed to send alert to ${profile.email}:`, sendError);
      }
    }

    await client.close();

    console.log(`Critical action alert sent to ${notifiedCount} super admins`);

    return new Response(JSON.stringify({ success: true, notified: notifiedCount }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending critical action alert:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
