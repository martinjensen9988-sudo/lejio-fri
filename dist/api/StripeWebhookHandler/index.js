const Stripe = require('stripe');
const { Client } = require('pg');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

// Webhook signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

module.exports = async function (context, req) {
  const client = new Client(dbConfig);

  try {
    // Verify webhook signature
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody || req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: `Webhook Error: ${err.message}` })
      };
      return;
    }

    await client.connect();

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, client, context);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, client, context);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, client, context);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object, client, context);
        break;

      default:
        context.log(`Unhandled event type ${event.type}`);
    }

    context.res = {
      status: 200,
      body: JSON.stringify({ received: true })
    };

  } catch (error) {
    context.log(`Webhook error: ${error.message}`);
    context.res = {
      status: 500,
      body: JSON.stringify({ error: error.message })
    };
  } finally {
    await client.end();
  }
};

/**
 * Handle new subscription - trigger provisioning immediately
 */
async function handleSubscriptionCreated(subscription, client, context) {
  try {
    const stripeCustomerId = subscription.customer;
    const planId = subscription.items.data[0]?.plan.id;

    // Find lessor by Stripe customer ID
    const result = await client.query(
      `SELECT id, company_name, email FROM fri_lessors 
       WHERE subscription_status = 'trial' 
       AND tenant_id IS NULL
       LIMIT 1`
    );

    if (result.rows.length === 0) {
      context.log(`No pending trial lessor found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    const lessor = result.rows[0];

    // Update lessor with Stripe customer ID
    await client.query(
      `UPDATE fri_lessors 
       SET stripe_customer_id = $1, subscription_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [stripeCustomerId, 'active', lessor.id]
    );

    // Trigger provisioning
    await triggerProvisioning(lessor.id, planId || 'dealer_plus', client, context);

    context.log(`Provisioning triggered for ${lessor.company_name} (Stripe: ${stripeCustomerId})`);

  } catch (error) {
    context.log(`Error in handleSubscriptionCreated: ${error.message}`);
    throw error;
  }
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription, client, context) {
  try {
    const stripeCustomerId = subscription.customer;

    // Update subscription metadata
    await client.query(
      `UPDATE fri_lessors 
       SET updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = $1`,
      [stripeCustomerId]
    );

    context.log(`Subscription updated for Stripe customer ${stripeCustomerId}`);

  } catch (error) {
    context.log(`Error in handleSubscriptionUpdated: ${error.message}`);
  }
}

/**
 * Handle successful payment - provision if needed
 */
async function handlePaymentSucceeded(invoice, client, context) {
  try {
    const stripeCustomerId = invoice.customer;
    const planId = invoice.lines.data[0]?.plan?.id;

    // Find lessor
    const result = await client.query(
      `SELECT id, company_name, tenant_id FROM fri_lessors 
       WHERE stripe_customer_id = $1`,
      [stripeCustomerId]
    );

    if (result.rows.length === 0) {
      context.log(`No lessor found for Stripe customer ${stripeCustomerId}`);
      return;
    }

    const lessor = result.rows[0];

    // If no tenant yet, provision now
    if (!lessor.tenant_id) {
      await triggerProvisioning(lessor.id, planId || 'dealer_plus', client, context);
      context.log(`Payment succeeded - Provisioning triggered for ${lessor.company_name}`);
    } else {
      context.log(`Payment succeeded for ${lessor.company_name} (already provisioned)`);
    }

  } catch (error) {
    context.log(`Error in handlePaymentSucceeded: ${error.message}`);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(subscription, client, context) {
  try {
    const stripeCustomerId = subscription.customer;

    // Update lessor status
    await client.query(
      `UPDATE fri_lessors 
       SET subscription_status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE stripe_customer_id = $2`,
      ['cancelled', stripeCustomerId]
    );

    context.log(`Subscription cancelled for Stripe customer ${stripeCustomerId}`);

  } catch (error) {
    context.log(`Error in handleSubscriptionCancelled: ${error.message}`);
  }
}

/**
 * Helper: Trigger provisioning via ProvisionTenant endpoint
 */
async function triggerProvisioning(lessorId, planId, client, context) {
  try {
    const https = require('https');
    const baseUrl = process.env.SITE_URL || 'https://lejio-fri.onrender.com';

    const payload = JSON.stringify({
      lessor_id: lessorId,
      subscription_tier: mapStripePlanToTier(planId)
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: new URL(baseUrl).hostname,
        port: 443,
        path: '/api/ProvisionTenant',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });

  } catch (error) {
    context.log(`Error triggering provisioning: ${error.message}`);
    throw error;
  }
}

/**
 * Map Stripe plan ID to subscription tier
 */
function mapStripePlanToTier(stripePlanId) {
  const mapping = {
    'price_dealer_start': 'dealer_start',
    'price_dealer_plus': 'dealer_plus',
    'price_dealer_pro': 'dealer_pro',
    'price_dealer_elite': 'dealer_elite',
    'price_rental_start': 'rental_start',
    'price_rental_growth': 'rental_growth',
    'price_workshop_start': 'workshop_start',
    'price_workshop_flow': 'workshop_flow',
    'price_workshop_scale': 'workshop_scale',
  };

  return mapping[stripePlanId] || 'dealer_plus';
}
