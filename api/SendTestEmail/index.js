import { HttpRequest, HttpResponseInit, app } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * @typedef {Object} SendTestEmailRequest
 * @property {string} integrationId - Email integration ID
 * @property {string} testEmail - Email to send test to
 */

async function sendTestEmail(request) {
  try {
    const body = await request.json();
    const { integrationId, testEmail } = body;

    if (!integrationId || !testEmail) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Fetch integration details
    const { data: integration, error: integrationError } = await supabase
      .from('lessor_email_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (integrationError || !integration) {
      return {
        status: 404,
        jsonBody: { error: 'Email integration not found' },
      };
    }

    // Create transporter based on type
    let transporter;
    const metadata = integration.metadata;

    if (integration.type === 'gmail') {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: integration.email,
          pass: metadata.passwordHash || '',
        },
      });
    } else if (integration.type === 'outlook') {
      transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: integration.email,
          pass: metadata.passwordHash || '',
        },
      });
    } else if (integration.type === 'custom_smtp') {
      transporter = nodemailer.createTransport({
        host: metadata.smtpHost || '',
        port: metadata.smtpPort || 587,
        secure: (metadata.smtpPort || 587) === 465,
        auth: {
          user: metadata.smtpUser || '',
          pass: metadata.smtpPassword || '',
        },
      });
    } else {
      return {
        status: 400,
        jsonBody: { error: 'Invalid email integration type' },
      };
    }

    // Send test email
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #667eea; }
            .header h1 { color: #667eea; margin: 0; }
            .content { padding: 20px 0; }
            .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; padding: 15px; margin: 20px 0; }
            .success-box h3 { color: #155724; margin-top: 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test Email</h1>
            </div>
            
            <div class="content">
              <p>Hej,</p>
              
              <div class="success-box">
                <h3>Email Integration Works! 🎉</h3>
                <p>Din email integration er korrekt konfigureret og fungerer som den skal.</p>
                <p><strong>Fra:</strong> ${integration.email}</p>
                <p><strong>Display navn:</strong> ${integration.display_name || '(Ikke angivet)'}</p>
                <p><strong>Type:</strong> ${
                  integration.type === 'gmail'
                    ? 'Gmail'
                    : integration.type === 'outlook'
                      ? 'Outlook'
                      : 'Custom SMTP'
                }</p>
              </div>
              
              <p>Du kan nu bruge denne email til at sende beskeder gennem LEJIO platformen.</p>
              
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Denne email blev sendt automatisk for at teste din email integration.
              </p>
            </div>
            
            <div class="footer">
              <p>&copy; 2026 LEJIO. Alle rettigheder forbeholdt.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: `${integration.display_name || 'LEJIO'} <${integration.email}>`,
      to: testEmail,
      subject: 'Test Email fra LEJIO - Integration Virker ✅',
      html: emailHtml,
      text: `Test email from ${integration.email} - Din email integration fungerer korrekt!`,
    });

    // Update last_tested_at
    await supabase
      .from('lessor_email_integrations')
      .update({
        last_tested_at: new Date().toISOString(),
      })
      .eq('id', integrationId);

    // Log activity
    const lessorId = integration.lessor_id;
    await supabase.from('email_activity_log').insert([
      {
        lessor_id: lessorId,
        integration_id: integrationId,
        recipient: testEmail,
        subject: 'Test Email fra LEJIO',
        email_type: 'test',
        status: 'sent',
      },
    ]);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Test email sent successfully',
      },
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    return {
      status: 500,
      jsonBody: {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send test email',
      },
    };
  }
}

app.function('SendTestEmail', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: sendTestEmail,
});
