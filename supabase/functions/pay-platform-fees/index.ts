import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('LEJIO_STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: authError } = await createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { feeIds, returnUrl } = await req.json();

    if (!feeIds || !Array.isArray(feeIds) || feeIds.length === 0) {
      throw new Error('No fee IDs provided');
    }

    console.log(`Processing payment for fees: ${feeIds.join(', ')} by user ${user.id}`);

    // Get the fees and verify they belong to this user
    const { data: fees, error: feesError } = await supabase
      .from('platform_fees')
      .select('*')
      .in('id', feeIds)
      .eq('lessor_id', user.id)
      .eq('status', 'pending');

    if (feesError) {
      console.error('Error fetching fees:', feesError);
      throw new Error('Could not fetch fees');
    }

    if (!fees || fees.length === 0) {
      throw new Error('No pending fees found');
    }

    // Calculate total amount
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    console.log(`Total amount: ${totalAmount} DKK for ${fees.length} fees`);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'dkk',
          product_data: {
            name: `LEJIO Platform Gebyr`,
            description: `${fees.length} booking gebyr${fees.length > 1 ? 'er' : ''} á 49 kr`,
          },
          unit_amount: Math.round(totalAmount * 100), // Stripe uses cents
        },
        quantity: 1,
      }],
      metadata: {
        fee_ids: feeIds.join(','),
        user_id: user.id,
        type: 'platform_fees',
      },
      success_url: returnUrl || `${req.headers.get('origin')}/dashboard?payment=success`,
      cancel_url: `${req.headers.get('origin')}/dashboard?payment=cancelled`,
    });

    console.log(`Created Stripe session: ${session.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: session.url,
        sessionId: session.id,
        amount: totalAmount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error processing platform fee payment:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
};

serve(handler);
