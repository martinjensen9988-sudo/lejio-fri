const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const { getSessionUserId } = require('../session');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const stripeKey = process.env.STRIPE_SECRET_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey);

const TIERS = {
  starter: { name: 'Starter', monthlyPrice: 349, yearlyPrice: 3560, maxVehicles: 5, stripeId: 'price_starter_monthly' },
  standard: { name: 'Standard', monthlyPrice: 599, yearlyPrice: 6110, maxVehicles: 15, stripeId: 'price_standard_monthly' },
  enterprise: { name: 'Enterprise', monthlyPrice: 899, yearlyPrice: 9170, maxVehicles: 35, stripeId: 'price_enterprise_monthly' },
};

async function sendPlanChangeEmail(profile, newTier, paymentMethod, price) {
  try {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@lejio.dk';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        password: smtpPassword,
      },
    });

    const tierInfo = TIERS[newTier];
    const companyName = profile.company_name || profile.full_name || 'Virksomhed';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .plan-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .plan-details div { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Din plan er ændret</h1>
            </div>

            <div class="content">
              <p>Hej ${companyName},</p>
              <p>Din abonnement er nu ændret til <strong>${tierInfo.name}</strong>-planen.</p>

              <div class="plan-details">
                <div><span class="label">Plan:</span> ${tierInfo.name}</div>
                <div><span class="label">Pris:</span> ${price} kr/måned</div>
                <div><span class="label">Startdato:</span> ${new Date().toLocaleDateString('da-DK')}</div>
                <div><span class="label">Betalingsmetode:</span> ${paymentMethod === 'card' ? 'Kreditkort (automatisk)' : 'Manual betaling'}</div>
              </div>

              <p>Du kan se detaljer om din plan anytime i dine indstillinger.</p>

              <p style="color: #666; margin-top: 30px;">
                Spørgsmål? Kontakt os på <a href="mailto:support@lejio.dk">support@lejio.dk</a>
              </p>
            </div>

            <div class="footer">
              <p>LEJIO | Alt til udlejning</p>
              <p>© ${new Date().getFullYear()} LEJIO ApS</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: smtpFromEmail,
      to: profile.email,
      subject: `Din plan er ændret til ${tierInfo.name}`,
      html,
      text: `Din plan er ændret til ${tierInfo.name}-planen.`,
    });

    console.log('[ChangePlan] Plan change email sent to:', profile.email);
  } catch (error) {
    console.error('[ChangePlan] Error sending plan change email:', error);
  }
}

async function sendPaymentRequest(profile, newTier, paymentMethod, price) {
  try {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPassword = process.env.SMTP_PASSWORD || '';
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || 'noreply@lejio.dk';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false,
      auth: {
        user: smtpUser,
        password: smtpPassword,
      },
    });

    const tierInfo = TIERS[newTier];
    const companyName = profile.company_name || profile.full_name || 'Virksomhed';

    const bankDetails = paymentMethod === 'bank_transfer' ? `
      <div class="plan-details">
        <div style="margin-bottom: 20px;">
          <strong>Bankoplysninger for betaling:</strong>
        </div>
        <div><span class="label">Modtager:</span> LEJIO ApS</div>
        <div><span class="label">Kontonummer:</span> DK12 1234 5678 9012 34</div>
        <div><span class="label">SWIFT:</span> DABADK22</div>
        <div><span class="label">Beløb:</span> ${price} kr</div>
        <div><span class="label">Reference:</span> ${profile.id}</div>
      </div>
    ` : '';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 5px; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; }
            .plan-details { background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; }
            .plan-details div { margin: 10px 0; }
            .label { font-weight: bold; color: #667eea; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${paymentMethod === 'invoice' ? '📄 Faktura anmodning' : '💳 Betalingsanmodning'}</h1>
            </div>

            <div class="content">
              <p>Hej ${companyName},</p>
              <p>Din ny ${tierInfo.name}-plan er klar til aktivering. Venligst foretag betaling for at aktivere planen.</p>

              <div class="plan-details">
                <div><span class="label">Plan:</span> ${tierInfo.name}</div>
                <div><span class="label">Pris:</span> ${price} kr/måned</div>
                <div><span class="label">Startdato:</span> ${new Date().toLocaleDateString('da-DK')}</div>
              </div>

              ${bankDetails}

              <p style="color: #666;">
                ${paymentMethod === 'invoice' 
                  ? 'Vi sender en detaljeret faktura snarest.' 
                  : 'Brug referencenummeret som besked ved betaling for at linke betalingen til din konto.'}
              </p>

              <p style="color: #666; margin-top: 30px;">
                Har du spørgsmål? Kontakt os på <a href="mailto:support@lejio.dk">support@lejio.dk</a>
              </p>
            </div>

            <div class="footer">
              <p>LEJIO | Alt til udlejning</p>
              <p>© ${new Date().getFullYear()} LEJIO ApS</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: smtpFromEmail,
      to: profile.email,
      subject: `${paymentMethod === 'invoice' ? 'Faktura for' : 'Betalingsanmodning for'} ${tierInfo.name}-plan`,
      html,
      text: `Betaling anmodet for ${tierInfo.name}-plan: ${price} kr/måned`,
    });

    console.log('[ChangePlan] Payment request email sent to:', profile.email);
  } catch (error) {
    console.error('[ChangePlan] Error sending payment request email:', error);
  }
}

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': req.headers?.origin || '*',
    'Access-Control-Allow-Credentials': 'true',
  };

  try {
    const body = req.body || {};
    const { newTier, paymentMethod } = body;

    console.log('[ChangePlan] Request:', { newTier, paymentMethod });

    if (!newTier || !paymentMethod) {
      context.res.status = 400;
      context.res.body = { error: 'Missing required fields: newTier, paymentMethod' };
      return context.res;
    }

    if (!TIERS[newTier]) {
      context.res.status = 400;
      context.res.body = { error: 'Invalid tier: ' + newTier };
      return context.res;
    }

    // Get authenticated user from session
    const userId = await getSessionUserId(req);
    if (!userId) {
      console.log('[ChangePlan] Not authenticated');
      context.res.status = 401;
      context.res.body = { error: 'Not authenticated' };
      return context.res;
    }

    console.log('[ChangePlan] Got userId:', userId);

    // Get user profile with current subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[ChangePlan] Profile fetch error:', profileError);
    }

    if (!profile) {
      console.log('[ChangePlan] Profile not found for user:', userId);
      context.res.status = 404;
      context.res.body = { error: 'Profile not found' };
      return context.res;
    }

    console.log('[ChangePlan] Got profile:', {
      id: profile.id,
      subscription_tier: profile.subscription_tier,
      stripe_subscription_id: profile.stripe_subscription_id,
    });

    const stripeSubscriptionId = profile.stripe_subscription_id;

    // If changing via card payment and has Stripe subscription, use Stripe
    if (paymentMethod === 'card') {
      if (!stripeSubscriptionId) {
        console.log('[ChangePlan] No Stripe subscription found for card payment');
        context.res.status = 400;
        context.res.body = { error: 'No active Stripe subscription found. Please use portal to upgrade.' };
        return context.res;
      }

      try {
        console.log('[ChangePlan] Updating Stripe subscription:', stripeSubscriptionId);
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const itemId = subscription.items.data[0].id;
        const tierConfig = TIERS[newTier];

        await stripe.subscriptions.update(stripeSubscriptionId, {
          items: [
            {
              id: itemId,
              price: tierConfig.stripeId,
            },
          ],
          proration_behavior: 'create_prorations',
        });

        console.log('[ChangePlan] Stripe subscription updated, now updating database');

        // Update database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: newTier,
            subscription_status: 'active',
            payment_method: 'card',
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[ChangePlan] Database update error:', updateError);
          throw updateError;
        }

        console.log('[ChangePlan] Database updated successfully');

        // Send confirmation email
        await sendPlanChangeEmail(profile, newTier, paymentMethod, TIERS[newTier].monthlyPrice);

        context.res.status = 200;
        context.res.body = {
          success: true,
          message: `Plan ændret til ${TIERS[newTier].name}`,
          tier: newTier,
        };
        return context.res;
      } catch (stripeError) {
        console.error('[ChangePlan] Stripe error:', stripeError);
        context.res.status = 500;
        context.res.body = {
          error: 'Kunne ikke opdatere abonnement hos Stripe: ' + (stripeError.message || 'Unknown error'),
        };
        return context.res;
      }
    }

    // For bank transfer or invoice methods
    if (paymentMethod === 'bank_transfer' || paymentMethod === 'invoice') {
      try {
        // Cancel Stripe subscription if they have one and switching to manual payment
        if (stripeSubscriptionId) {
          try {
            console.log('[ChangePlan] Cancelling Stripe subscription:', stripeSubscriptionId);
            await stripe.subscriptions.del(stripeSubscriptionId);
          } catch (err) {
            console.error('[ChangePlan] Error cancelling Stripe subscription:', err);
          }
        }

        console.log('[ChangePlan] Updating database with manual payment method');

        // Update database with new payment method
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            subscription_tier: newTier,
            subscription_status: 'pending_payment',
            payment_method: paymentMethod,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateError) {
          console.error('[ChangePlan] Database update error:', updateError);
          throw updateError;
        }

        console.log('[ChangePlan] Database updated, sending payment request email');

        // Send payment request email
        await sendPaymentRequest(profile, newTier, paymentMethod, TIERS[newTier].monthlyPrice);

        context.res.status = 200;
        context.res.body = {
          success: true,
          message: `Plan ændret til ${TIERS[newTier].name}. ${
            paymentMethod === 'invoice'
              ? 'Vi sender en faktura til din email.'
              : 'Vi sender bankoplysninger til betaling.'
          }`,
          tier: newTier,
        };
        return context.res;
      } catch (error) {
        console.error('[ChangePlan] Error:', error);
        context.res.status = 500;
        context.res.body = {
          error: 'Kunne ikke ændre plan: ' + (error.message || 'Unknown error'),
        };
        return context.res;
      }
    }

    context.res.status = 400;
    context.res.body = { error: 'Invalid payment method' };
    return context.res;
  } catch (error) {
    console.error('[ChangePlan] Unhandled error:', error);
    context.res.status = 500;
    context.res.body = {
      error: 'Kunde ikke ændre plan: ' + (error.message || 'Unknown error'),
    };
    return context.res;
  }
};
