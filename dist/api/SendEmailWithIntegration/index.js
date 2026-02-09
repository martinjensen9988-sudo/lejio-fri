import { HttpRequest, HttpResponseInit, app } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface SendEmailRequest {
  lessorId: string;
  recipient: string;
  subject: string;
  html: string;
  text?: string;
  emailType?: string;
  integrationId?: string; // If specified, use this integration. Otherwise use default.
}

async function sendEmailWithIntegration(
  request: HttpRequest
): Promise<HttpResponseInit> {
  try {
    const body: SendEmailRequest = await request.json();
    const { lessorId, recipient, subject, html, text, emailType, integrationId } = body;

    if (!lessorId || !recipient || !subject || !html) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Fetch email integration (use specified one or find default)
    let integration;

    if (integrationId) {
      const { data, error } = await supabase
        .from('lessor_email_integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('lessor_id', lessorId)
        .single();

      if (error || !data) {
        return {
          status: 404,
          jsonBody: { error: 'Email integration not found' },
        };
      }
      integration = data;
    } else {
      // Get default integration
      const { data, error } = await supabase
        .from('lessor_email_integrations')
        .select('*')
        .eq('lessor_id', lessorId)
        .eq('is_default', true)
        .single();

      if (error || !data) {
        // Fall back to system SMTP if no integration configured
        return await sendWithSystemSMTP(recipient, subject, html, text);
      }
      integration = data;
    }

    // Create transporter based on integration type
    let transporter: nodemailer.Transporter;
    const metadata = integration.metadata as Record<string, any>;

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

    // Send email
    await transporter.sendMail({
      from: `${integration.display_name || 'LEJIO'} <${integration.email}>`,
      to: recipient,
      subject: subject,
      html: html,
      text: text || subject,
    });

    // Log activity
    await supabase.from('email_activity_log').insert([
      {
        lessor_id: lessorId,
        integration_id: integration.id,
        recipient: recipient,
        subject: subject,
        email_type: emailType || 'general',
        status: 'sent',
      },
    ]);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Email sent successfully',
        integrationEmail: integration.email,
      },
    };
  } catch (error) {
    console.error('Error sending email with integration:', error);
    return {
      status: 500,
      jsonBody: {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send email',
      },
    };
  }
}

// Fallback to system SMTP
async function sendWithSystemSMTP(
  recipient: string,
  subject: string,
  html: string,
  text?: string
): Promise<HttpResponseInit> {
  try {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@lejio.dk';

    if (!smtpHost || !smtpUser || !smtpPassword) {
      return {
        status: 500,
        jsonBody: { error: 'No email integration configured and system SMTP not available' },
      };
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        password: smtpPassword,
      },
    });

    await transporter.sendMail({
      from: smtpFromEmail,
      to: recipient,
      subject: subject,
      html: html,
      text: text || subject,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Email sent via system SMTP',
      },
    };
  } catch (error) {
    console.error('Error sending with system SMTP:', error);
    return {
      status: 500,
      jsonBody: {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send email',
      },
    };
  }
}

app.function('SendEmailWithIntegration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: sendEmailWithIntegration,
});
