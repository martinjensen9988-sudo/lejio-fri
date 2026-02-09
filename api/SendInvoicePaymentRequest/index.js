import { HttpRequest, HttpResponseInit, app } from '@azure/functions';
import { createClient } from '@supabase/supabase-js';
import * as nodemailer from 'nodemailer';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const mailHost = process.env.MAIL_HOST || '';
const mailPort = parseInt(process.env.MAIL_PORT || '587');
const mailUser = process.env.MAIL_USER || '';
const mailPassword = process.env.MAIL_PASSWORD || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const transporter = nodemailer.createTransport({
  host: mailHost,
  port: mailPort,
  secure: mailPort === 465,
  auth: {
    user: mailUser,
    pass: mailPassword,
  },
});

/**
 * @typedef {Object} InvoicePaymentRequestBody
 * @property {string} invoiceId - Invoice ID
 * @property {string} email - Recipient email
 * @property {string} [paymentMethod] - Payment method type
 */

async function sendInvoicePaymentRequest(request) {
  try {
    const body = await request.json();
    const { invoiceId, email, paymentMethod = 'invoice' } = body;

    if (!invoiceId || !email) {
      return {
        status: 400,
        jsonBody: { error: 'Missing required fields' },
      };
    }

    // Get invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*, bookings(*, lessor_id)')
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      return {
        status: 404,
        jsonBody: { error: 'Invoice not found' },
      };
    }

    // Get lessor details
    const { data: lessor, error: lessorError } = await supabase
      .from('profiles')
      .select('company_name, email, full_name')
      .eq('id', invoice.bookings.lessor_id)
      .single();

    if (lessorError || !lessor) {
      return {
        status: 404,
        jsonBody: { error: 'Lessor not found' },
      };
    }

    // Generate payment details HTML
    const bankDetails = `
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Bankoplysninger</h3>
        <p><strong>Modtager:</strong> LEJIO ApS</p>
        <p><strong>IBAN:</strong> DK5520000000000000000000</p>
        <p><strong>BIC:</strong> NORSDK22</p>
        <p><strong>Reference:</strong> ${invoice.invoice_number}</p>
        <p><strong>Beløb:</strong> ${invoice.amount.toLocaleString('da-DK')} kr</p>
      </div>
    `;

    const paymentInstructions =
      paymentMethod === 'bank_transfer'
        ? bankDetails
        : `
        <p>Du kan betale denne faktura ved at klikke på knappen nedenfor:</p>
        <a href="https://lejio.dk/invoices/${invoiceId}/pay" 
           style="display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; 
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0;">
          Betal nu
        </a>
      `;

    const emailContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #667eea; }
            .header h1 { color: #667eea; margin: 0; }
            .content { padding: 20px 0; }
            .invoice-details { background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .invoice-details p { margin: 10px 0; }
            .footer { text-align: center; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
            .cta-button { display: inline-block; background-color: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Betalingsanmodning</h1>
            </div>
            
            <div class="content">
              <p>Hej ${lessor.full_name || lessor.company_name},</p>
              
              <p>Vi har en faktura klar til betaling. Se detaljerne nedenfor:</p>
              
              <div class="invoice-details">
                <p><strong>Fakturanummer:</strong> ${invoice.invoice_number}</p>
                <p><strong>Beløb:</strong> ${invoice.amount.toLocaleString('da-DK')} kr</p>
                <p><strong>Forfaldsdato:</strong> ${new Date(invoice.due_date).toLocaleDateString('da-DK')}</p>
                <p><strong>Status:</strong> ${invoice.status === 'paid' ? 'Betalt' : 'Afventer betaling'}</p>
              </div>
              
              <h3>Betalingsmuligheder</h3>
              ${paymentInstructions}
              
              <div style="background-color: #e8f4f8; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
                <p style="margin: 0;">
                  <strong>Spørgsmål?</strong> Kontakt vores support på support@lejio.dk
                </p>
              </div>
            </div>
            
            <div class="footer">
              <p>Denne email er sendt automatisk fra LEJIO. Du kan ikke svare direkte på denne email.</p>
              <p>&copy; 2026 LEJIO ApS. Alle rettigheder forbeholdt.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'noreply@lejio.dk',
      to: email,
      subject: `Betalingsanmodning - Faktura ${invoice.invoice_number}`,
      html: emailContent,
      text: `Betalingsanmodning for faktura ${invoice.invoice_number}\n\nBeløb: ${invoice.amount} kr\nForfaldsdato: ${new Date(invoice.due_date).toLocaleDateString('da-DK')}\n\nBetaling kan foretages på: https://lejio.dk/invoices/${invoiceId}/pay`,
    });

    // Update invoice record
    await supabase
      .from('invoices')
      .update({
        payment_method: paymentMethod,
        payment_requested_at: new Date().toISOString(),
        payment_request_email: email,
      })
      .eq('id', invoiceId);

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Payment request email sent',
      },
    };
  } catch (error) {
    console.error('Error sending invoice payment request:', error);
    return {
      status: 500,
      jsonBody: {
        error:
          error instanceof Error ? error.message : 'Failed to send payment request',
      },
    };
  }
}

app.function('SendInvoicePaymentRequest', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: sendInvoicePaymentRequest,
});
