import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create Stripe subscription and return client secret for Stripe Elements
async function createStripeSubscription(
  email: string,
  priceId: string,
  stripeSecretKey: string
): Promise<{ clientSecret: string; subscriptionId: string }> {
  const stripe = await import("https://esm.sh/stripe@14.21.0");
  const stripeClient = new stripe.default(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  // Create or retrieve customer
  const customers = await stripeClient.customers.list({ email });
  let customer = customers.data[0];
  if (!customer) {
    customer = await stripeClient.customers.create({ email });
  }

  // Create subscription
  const subscription = await stripeClient.subscriptions.create({
    customer: customer.id,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });

  const paymentIntent = subscription.latest_invoice.payment_intent;
  return {
    clientSecret: paymentIntent.client_secret,
    subscriptionId: subscription.id,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('LEJIO_STRIPE_SECRET_KEY');

    // Validate authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const { email, vehicleId, plan } = await req.json();
    if (!email || !vehicleId || !plan) {
      return new Response(JSON.stringify({ error: 'Missing email, vehicleId eller plan' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find bil og forhandler
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, owner_id')
      .eq('id', vehicleId)
      .single();
    if (vehicleError || !vehicle) {
      return new Response(JSON.stringify({ error: 'Vehicle not found' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const dealerId = vehicle.owner_id;

    // Find dealer_stripe_settings
    const { data: stripeSettings, error: stripeError } = await supabase
      .from('dealer_stripe_settings')
      .select('*')
      .eq('dealer_id', dealerId)
      .single();
    if (stripeError || !stripeSettings) {
      return new Response(JSON.stringify({ error: 'Stripe settings not found for dealer' }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vælg priceId efter plan
    let priceId = '';
    if (plan === 'standard') priceId = stripeSettings.stripe_price_id_standard;
    else if (plan === 'premium') priceId = stripeSettings.stripe_price_id_premium;
    else {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Brug dealerens Stripe secret key
    const dealerStripeSecretKey = stripeSettings.stripe_secret_key;
    if (!dealerStripeSecretKey) {
      return new Response(JSON.stringify({ error: 'Dealer Stripe key missing' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Opret Stripe subscription
    const { clientSecret, subscriptionId } = await createStripeSubscription(email, priceId, dealerStripeSecretKey);

    return new Response(JSON.stringify({ clientSecret, subscriptionId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return new Response(JSON.stringify({ error: 'Subscription creation failed' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
