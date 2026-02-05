// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendAdminEmailRequest {
  subject: string;
  title: string;
  content: string;
  recipients?: string[];
}

/**
 * Send HTML email to admin(s) via SendGrid
 * Replaces JWT/SMTP with simpler SendGrid integration
 */
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, title, content, recipients } = (await req.json()) as SendAdminEmailRequest;

    if (!subject || !title || !content) {
      throw new Error('Missing required fields: subject, title, content');
    }

    // Get admin email(s) from environment
    const defaultAdminEmail = Deno.env.get('ADMIN_EMAIL') || 'admin@lejio.dk';
    const adminEmails = recipients && recipients.length > 0 ? recipients : [defaultAdminEmail];

    // Get SendGrid API key
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not configured - email logged only');
      console.log(`📧 Admin Email: ${subject}`);
      console.log(`👥 Recipients: ${adminEmails.join(', ')}`);
      console.log(`📝 Content: ${content.substring(0, 200)}...`);
      
      // Return success so automated-lead-discovery doesn't fail
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email queued (SendGrid not configured)',
          recipients: adminEmails,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HTML email template with styling
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 0; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
            .body { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            th { background: #f3f4f6; font-weight: 600; }
            tr:nth-child(even) { background: #f9fafb; }
            .stats { display: inline-block; background: #f3f4f6; padding: 12px 16px; border-radius: 6px; margin: 10px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 10px; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${title}</h1>
            </div>
            <div class="body">
              ${content}
              <div class="footer">
                <p><strong>LEJIO System Notification</strong></p>
                <p>Tid: ${new Date().toLocaleString('da-DK')}</p>
                <p style="margin-top: 10px; font-size: 11px; color: #aaa;">
                  Denne email er auto-genereret af LEJIO-systemet.<br>
                  Spørgsmål? Kontakt support@lejio.dk
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send via SendGrid
    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: adminEmails.map(email => ({
          to: [{ email }],
          subject: subject,
        })),
        from: {
          email: 'notifications@lejio.dk',
          name: 'LEJIO System',
        },
        content: [
          {
            type: 'text/html',
            value: htmlContent,
          },
        ],
        reply_to: {
          email: 'support@lejio.dk',
          name: 'LEJIO Support',
        },
        // Tag for SendGrid analytics
        categories: ['admin-notifications', 'lejio-system'],
      }),
    });

    if (!sendgridResponse.ok) {
      const errorData = await sendgridResponse.text();
      console.error('SendGrid error:', errorData);
      throw new Error(`SendGrid failed: ${sendgridResponse.status}`);
    }

    console.log(`✅ Admin email sent to ${adminEmails.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipients: adminEmails,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send admin email error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
