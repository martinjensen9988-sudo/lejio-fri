// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendDamageReportRequest {
  reportId: string;
  recipientEmail: string;
  recipientName: string;
  pdfUrl: string;
  vehicleName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, recipientEmail, recipientName, pdfUrl, vehicleName }: SendDamageReportRequest = await req.json();

    console.log(`Sending damage report ${reportId} to ${recipientEmail}`);

    // Create email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Skadesrapport</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 0; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
          .vehicle-info { background: white; padding: 16px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #667eea; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Skadesrapport</h1>
          </div>
          <div class="content">
            <p>Hej ${recipientName},</p>
            <p>Hermed fremsendes skadesrapport for:</p>
            <div class="vehicle-info">
              <strong>${vehicleName}</strong>
              <p style="margin: 5px 0 0 0; color: #6b7280;">Rapport ID: ${reportId}</p>
            </div>
            <p>Du kan se og downloade rapporten ved at klikke på linket nedenfor:</p>
            <p style="text-align: center;">
              <a href="${pdfUrl}" class="button">📥 Download Skadesrapport</a>
            </p>
            <p>Hvis du har spørgsmål til rapporten eller skaderne, er du velkonmen til at kontakte os.</p>
            <div class="footer">
              <p style="margin: 0;">Med venlig hilsen,<br><strong>LEJIO Team</strong></p>
              <p style="margin-top: 10px; font-size: 11px; color: #aaa;">
                Denne email er sendt automatisk fra LEJIO.<br>
                Kontakt: support@lejio.dk
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send via SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (!sendgridApiKey) {
      console.warn('⚠️ SENDGRID_API_KEY not configured - email not sent');
      return new Response(
        JSON.stringify({ success: true, message: 'Email prepared (SendGrid not configured)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: recipientEmail, name: recipientName }],
            subject: `📋 Skadesrapport - ${vehicleName}`,
          },
        ],
        from: {
          email: 'reports@lejio.dk',
          name: 'LEJIO Damage Reports',
        },
        content: [
          {
            type: 'text/html',
            value: emailHtml,
          },
        ],
        reply_to: {
          email: 'support@lejio.dk',
          name: 'LEJIO Support',
        },
        categories: ['damage-report'],
      }),
    });

    if (!sendgridResponse.ok) {
      const errorText = await sendgridResponse.text();
      console.error('SendGrid error:', errorText);
      throw new Error(`SendGrid failed: ${sendgridResponse.status}`);
    }

    console.log(`✅ Damage report sent to ${recipientEmail}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Skadesrapport sendt',
        recipient: recipientEmail,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending damage report:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send damage report' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
