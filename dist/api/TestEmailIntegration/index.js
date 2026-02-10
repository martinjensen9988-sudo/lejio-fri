import { HttpRequest, HttpResponseInit, app } from '@azure/functions';
import * as nodemailer from 'nodemailer';

/**
 * @typedef {Object} TestIntegrationRequest
 * @property {string} type - Integration type: 'gmail', 'outlook', or 'custom_smtp'
 * @property {string} email - Email address
 * @property {Object} metadata - Integration metadata with credentials
 */

async function testEmailIntegration(request) {
  try {
    const body = await request.json();
    const { type, email, metadata } = body;

    if (!type || !email || !metadata) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    let transporter;

    if (type === 'gmail') {
      // Gmail SMTP configuration
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: metadata.passwordHash || '',
        },
      });
    } else if (type === 'outlook') {
      // Outlook SMTP configuration
      transporter = nodemailer.createTransport({
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: metadata.passwordHash || '',
        },
      });
    } else if (type === 'custom_smtp') {
      // Custom SMTP configuration
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

    // Test the connection
    await transporter.verify();

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Email integration test successful',
      },
    };
  } catch (error) {
    console.error('Error testing email integration:', error);
    return {
      status: 400,
      jsonBody: {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to test email integration. Check your credentials.',
      },
    };
  }
}

app.function('TestEmailIntegration', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: testEmailIntegration,
});
