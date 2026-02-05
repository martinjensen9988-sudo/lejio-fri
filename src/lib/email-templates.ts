// Email template system with Danish localization

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | Date;
}

// Email templates in Danish
const templates = {
  invoice_sent: {
    da: {
      subject: 'Din faktura fra Lejio',
      html: `
<html dir="ltr" lang="da">
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1f2937;">Din faktura er klar</h1>
    <p>Hej {{renter_name}},</p>
    <p>Vi har genereret en faktura for dit biler leje hos Lejio.</p>
    <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Faktura nr.:</strong> {{invoice_number}}</p>
      <p><strong>Beløb:</strong> {{amount}} DKK</p>
      <p><strong>Forfaldsdato:</strong> {{due_date}}</p>
      <p><strong>Status:</strong> {{status}}</p>
    </div>
    <a href="{{invoice_link}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Se faktura</a>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Spørgsmål? Kontakt os på support@lejio.dk</p>
  </div>
</body>
</html>
      `,
      text: `Din faktura fra Lejio

Hej {{renter_name}},

Vi har genereret en faktura for dit biler leje hos Lejio.

Faktura nr.: {{invoice_number}}
Beløb: {{amount}} DKK
Forfaldsdato: {{due_date}}
Status: {{status}}

Se faktura: {{invoice_link}}

Spørgsmål? Kontakt os på support@lejio.dk
      `,
    },
  },
  payment_reminder_overdue: {
    da: {
      subject: 'Rykkerskrivelse: Betaling forfalden',
      html: `
<html dir="ltr" lang="da">
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #dc2626;">Betaling er forfalden</h1>
    <p>Hej {{renter_name}},</p>
    <p>Din faktura fra Lejio er {{days_overdue}} dage forfalden.</p>
    <div style="background-color: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
      <p><strong>Faktura nr.:</strong> {{invoice_number}}</p>
      <p><strong>Forfaldsdato:</strong> {{due_date}}</p>
      <p><strong>Restbeløb:</strong> {{amount_due}} DKK</p>
    </div>
    <p>Venligst betaler så snart som muligt for at undgå yderligere renter og gebyrer.</p>
    <a href="{{payment_link}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Betal nu</a>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Spørgsmål? Kontakt os på support@lejio.dk</p>
  </div>
</body>
</html>
      `,
      text: `Rykkerskrivelse: Betaling forfalden

Hej {{renter_name}},

Din faktura fra Lejio er {{days_overdue}} dage forfalden.

Faktura nr.: {{invoice_number}}
Forfaldsdato: {{due_date}}
Restbeløb: {{amount_due}} DKK

Venligst betaler så snart som muligt for at undgå yderligere renter og gebyrer.

Betal nu: {{payment_link}}

Spørgsmål? Kontakt os på support@lejio.dk
      `,
    },
  },
  subscription_created: {
    da: {
      subject: 'Dit abonnement hos Lejio er oprettet',
      html: `
<html dir="ltr" lang="da">
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #1f2937;">Abonnement oprettet</h1>
    <p>Hej {{renter_name}},</p>
    <p>Dit abonnement hos Lejio er nu oprettet!</p>
    <div style="background-color: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Køretøj:</strong> {{vehicle_name}}</p>
      <p><strong>Abonnementstype:</strong> {{subscription_type}}</p>
      <p><strong>Daglig pris:</strong> {{daily_rate}} DKK</p>
      <p><strong>Næste fakturering:</strong> {{next_billing_date}}</p>
    </div>
    <a href="{{subscription_link}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Se abonnement</a>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Spørgsmål? Kontakt os på support@lejio.dk</p>
  </div>
</body>
</html>
      `,
      text: `Dit abonnement hos Lejio er oprettet

Hej {{renter_name}},

Dit abonnement hos Lejio er nu oprettet!

Køretøj: {{vehicle_name}}
Abonnementstype: {{subscription_type}}
Daglig pris: {{daily_rate}} DKK
Næste fakturering: {{next_billing_date}}

Se abonnement: {{subscription_link}}

Spørgsmål? Kontakt os på support@lejio.dk
      `,
    },
  },
  payment_successful: {
    da: {
      subject: 'Betaling modtaget - tak',
      html: `
<html dir="ltr" lang="da">
<body style="font-family: Arial, sans-serif; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #059669;">Betaling modtaget</h1>
    <p>Hej {{payer_name}},</p>
    <p>Vi har modtaget din betaling. Tak!</p>
    <div style="background-color: #ecfdf5; padding: 20px; margin: 20px 0; border-radius: 8px;">
      <p><strong>Beløb betalt:</strong> {{amount}} DKK</p>
      <p><strong>Betalingsdato:</strong> {{payment_date}}</p>
      <p><strong>Transaktions-ID:</strong> {{transaction_id}}</p>
    </div>
    <p>Din faktura er nu mærket som betalt.</p>
    <p style="color: #666; font-size: 12px; margin-top: 30px;">Spørgsmål? Kontakt os på support@lejio.dk</p>
  </div>
</body>
</html>
      `,
      text: `Betaling modtaget - tak

Hej {{payer_name}},

Vi har modtaget din betaling. Tak!

Beløb betalt: {{amount}} DKK
Betalingsdato: {{payment_date}}
Transaktions-ID: {{transaction_id}}

Din faktura er nu mærket som betalt.

Spørgsmål? Kontakt os på support@lejio.dk
      `,
    },
  },
};

// Template rendering
export const renderTemplate = (
  templateName: keyof typeof templates,
  variables: TemplateVariables,
  language: 'da' = 'da'
): EmailTemplate => {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template not found: ${templateName}`);
  }

  const lang = template[language as 'da'] || template['da'];
  if (!lang) {
    throw new Error(`Language not supported: ${language}`);
  }

  const replace = (text: string) => {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      return value !== undefined ? String(value) : match;
    });
  };

  return {
    subject: replace(lang.subject),
    html: replace(lang.html),
    text: replace(lang.text),
  };
};

// Email send helper
export interface SendEmailOptions {
  to: string;
  templateName: keyof typeof templates;
  variables: TemplateVariables;
  language?: 'da';
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  const template = renderTemplate(options.templateName, options.variables, options.language);

  try {
    const response = await fetch('/functions/v1/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: options.to,
        subject: template.subject,
        html: template.html,
        text: template.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email sending failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Email queue for batch sending
export class EmailQueue {
  private queue: SendEmailOptions[] = [];
  private processing = false;

  add(options: SendEmailOptions): void {
    this.queue.push(options);
    this.process();
  }

  addBatch(optionsList: SendEmailOptions[]): void {
    this.queue.push(...optionsList);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const options = this.queue.shift();
      if (options) {
        try {
          await sendEmail(options);
        } catch (error) {
          console.error('Error in email queue:', error);
          // Re-add to queue for retry
          this.queue.unshift(options);
          break;
        }
      }
    }

    this.processing = false;
  }
}

export const emailQueue = new EmailQueue();
