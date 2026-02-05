import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Stripe webhook handler for subscription events
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const event = await req.json();
    const type = event.type;
    const data = event.data.object;

    // Supabase service client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle subscription events
    if (type === 'customer.subscription.deleted') {
      // Find subscription in DB and mark as cancelled
      const stripeSubId = data.id;
      await supabase
        .from('subscriptions')
        .update({ status: 'cancelled', end_date: new Date().toISOString() })
        .eq('stripe_subscription_id', stripeSubId);
    }
    if (type === 'customer.subscription.updated') {
      // Update status if needed
      const stripeSubId = data.id;
      const status = data.status;
      let dbStatus = null;
      if (status === 'active') dbStatus = 'active';
      if (status === 'canceled' || status === 'canceled' || status === 'unpaid' || status === 'incomplete_expired') dbStatus = 'cancelled';
      if (dbStatus) {
        await supabase
          .from('subscriptions')
          .update({ status: dbStatus })
          .eq('stripe_subscription_id', stripeSubId);
      }
    }
    // Add more event types as needed

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return new Response(JSON.stringify({ error: 'Webhook error' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
