// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendLeadEmailRequest {
  leadId: string;
  companyName: string;
  contactEmail: string;
  industry: string;
  city?: string;
  reason: string;
  subject?: string;
  body?: string;
}

interface OpenAiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OpenAiChoice {
  message: OpenAiMessage;
}

interface OpenAiResponse {
  choices: OpenAiChoice[];
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      leadId,
      companyName,
      contactEmail,
      industry,
      city,
      reason,
      subject,
      body,
    } = (await req.json()) as SendLeadEmailRequest;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let emailSubject = subject;
    let emailBody = body;

    // Generate email if not provided
    if (!emailBody || !emailSubject) {
      const emailResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `Du skriver professionelle, personaliserede sales-emails på dansk for LEJIO - en moderne biludlejningsplatform.

Emailen skal:
- Være varm og personlig (mentioner virksomhedsnavnet og industri)
- Forklare hvordan LEJIO kan hjælpe deres forretning
- Inkludere konkrete fordele for deres industri
- Afslutte med en stærk CTA (call to action) til at booke demo
- Være kort (max 200 ord)
- Signeres af LEJIO sales team

Return JSON med:
{
  "subject": "Emne for emailen",
  "body": "Email body i markdown"
}`,
            },
            {
              role: 'user',
              content: `Skriv en personaliseret sales-email til:
Virksomhed: ${companyName}
Industri: ${industry}
By: ${city || 'Danmark'}
Grund til at kontakte: ${reason}`,
            },
          ],
          max_tokens: 600,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to generate email');
      }

      const emailData = (await emailResponse.json()) as OpenAiResponse;
      const emailContent = emailData.choices?.[0]?.message?.content || '';

      try {
        const parsed = JSON.parse(emailContent);
        emailSubject = parsed.subject || 'Velkommen til LEJIO';
        emailBody = parsed.body || 'Tak fordi du overvejer LEJIO!';
      } catch (e: any) {
        console.error('Failed to parse email generation:', e);
        emailSubject = 'Velkommen til LEJIO';
        emailBody = `Hej ${companyName},\n\nVi synes at LEJIO kunne være perfekt for jer!\n\nVed du gerne høre mere?\n\nMed venlig hilsen,\nLEJIO Sales Team`;
      }
    }

    // Save email to database before sending
    const { data: savedEmail, error: saveError } = await supabase
      .from('lead_emails_sent')
      .insert({
        lead_id: leadId,
        company_name: companyName,
        recipient_email: contactEmail,
        subject: emailSubject,
        body: emailBody,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving email record:', saveError);
    }

    // Mark lead as email_sent in leads table
    await supabase
      .from('leads')
      .update({
        email_sent: true,
        email_status: 'sent',
        last_email_sent_at: new Date().toISOString(),
      })
      .eq('id', leadId)
      .catch((err: any) => console.error('Error updating lead status:', err));

    // Send actual email via SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY');
    if (sendgridApiKey) {
      try {
        const sendgridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [
              {
                to: [{ email: contactEmail, name: companyName }],
                subject: emailSubject,
              },
            ],
            from: {
              email: 'sales@lejio.dk',
              name: 'LEJIO Sales Team',
            },
            content: [
              {
                type: 'text/html',
                value: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; line-height: 1.6; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                        .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; }
                      </style>
                    </head>
                    <body>
                      <div class="container">
                        <div class="header">
                          <h1 style="margin: 0;">Velkommen til LEJIO</h1>
                        </div>
                        <div class="content">
                          ${emailBody.replace(/\n/g, '<br>')}
                          <div class="footer">
                            <p>Med venlig hilsen,<br><strong>LEJIO Sales Team</strong></p>
                          </div>
                        </div>
                      </div>
                    </body>
                  </html>
                `,
              },
            ],
            reply_to: {
              email: 'support@lejio.dk',
              name: 'LEJIO Support',
            },
            categories: ['lead-welcome-email', 'sales'],
          }),
        });

        if (!sendgridResponse.ok) {
          const errorText = await sendgridResponse.text();
          console.error('SendGrid error:', errorText);
          // Still mark as sent in DB even if email fails (for retry logic later)
          await supabase
            .from('lead_emails_sent')
            .update({ status: 'failed' })
            .eq('lead_id', leadId)
            .catch((err: any) => console.error('Error updating email status:', err));
        } else {
          console.log(`✅ Email sent to ${companyName} (${contactEmail})`);
          await supabase
            .from('lead_emails_sent')
            .update({ status: 'sent' })
            .eq('lead_id', leadId)
            .catch((err: any) => console.error('Error updating email status:', err));
        }
      } catch (emailError: any) {
        console.error('SendGrid email error:', emailError);
      }
    } else {
      console.warn('⚠️ SENDGRID_API_KEY not configured - email not sent');
    }

    return new Response(
      JSON.stringify({
        success: true,
        leadId,
        email: {
          to: contactEmail,
          subject: emailSubject,
          body: emailBody,
        },
        saved: !!savedEmail,
        message: 'Email generated and recorded',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send lead email error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to send email',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
