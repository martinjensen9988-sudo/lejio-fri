import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Verify Stripe webhook signature
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    // Extract timestamp and signatures from header
    const elements = signature.split(',');
    const timestampElement = elements.find(e => e.startsWith('t='));
    const signatureElement = elements.find(e => e.startsWith('v1='));
    
    if (!timestampElement || !signatureElement) {
      console.error('Missing timestamp or signature in header');
      return false;
    }
    
    const timestamp = timestampElement.split('=')[1];
    const expectedSignature = signatureElement.split('=')[1];
    
    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`;
    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    
    // Convert to hex
    const computedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Timing-safe comparison
    if (computedSignature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < computedSignature.length; i++) {
      result |= computedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get('LEJIO_STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Stripe API key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.text();
    
    // Verify webhook signature
    const webhookSecret = Deno.env.get('PLATFORM_FEE_WEBHOOK_SECRET');
    const signature = req.headers.get('stripe-signature');
    
    if (webhookSecret && signature) {
      const isValid = await verifyStripeSignature(body, signature, webhookSecret);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response('Invalid signature', { status: 401 });
      }
      console.log('Webhook signature verified successfully');
    } else if (webhookSecret && !signature) {
      console.error('Missing stripe-signature header');
      return new Response('Missing signature', { status: 401 });
    } else {
      console.warn('PLATFORM_FEE_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    let event: Stripe.Event;
    
    try {
      event = JSON.parse(body);
    } catch (err) {
      console.error('Error parsing webhook body:', err);
      return new Response('Invalid payload', { status: 400 });
    }

    console.log(`Received webhook event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.metadata?.type === 'platform_fees') {
        const feeIds = session.metadata.fee_ids?.split(',') || [];
        const userId = session.metadata.user_id;

        console.log(`Platform fees payment completed for user ${userId}, fees: ${feeIds.join(', ')}`);

        if (feeIds.length > 0) {
          // Update all fees to paid
          const { error: updateError } = await supabase
            .from('platform_fees')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .in('id', feeIds)
            .eq('lessor_id', userId);

          if (updateError) {
            console.error('Error updating fees:', updateError);
            throw new Error('Failed to update fee status');
          }

          console.log(`Successfully marked ${feeIds.length} fees as paid`);

          // Get lessor profile and send confirmation email
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', userId)
            .single();

          if (profile) {
            const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
            
            // Send confirmation email
            try {
              const cronSecret = Deno.env.get('CRON_SECRET');
              await fetch(`${supabaseUrl}/functions/v1/send-fee-payment-confirmation`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${cronSecret}`,
                },
                body: JSON.stringify({
                  lessorEmail: profile.email,
                  lessorName: profile.full_name || 'Udlejer',
                  amount: totalAmount,
                  feeCount: feeIds.length,
                }),
              });
              console.log('Payment confirmation email sent');
            } catch (emailError) {
              console.error('Failed to send confirmation email:', emailError);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
};

serve(handler);
