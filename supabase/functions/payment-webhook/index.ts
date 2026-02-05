import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

interface WebhookEvent {
  eventType: 'payment.completed' | 'payment.failed' | 'payment.cancelled';
  transactionId: string;
  bookingId?: string;
  amount?: number;
  metadata?: Record<string, string>;
}

// Verify Stripe webhook signature using Web Crypto API
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.substring(2);
    const v1Signature = elements.find(e => e.startsWith('v1='))?.substring(3);
    
    if (!timestamp || !v1Signature) return false;
    
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedSignature === v1Signature;
  } catch (e) {
    console.error('Stripe signature verification failed:', e);
    return false;
  }
}

// Parse Stripe webhook for LEJIO commission payments
function parseStripeWebhook(body: unknown): WebhookEvent | null {
  const eventType = body.type;
  const session = body.data?.object;
  
  if (!session) return null;
  
  let parsedEventType: WebhookEvent['eventType'];
  
  switch (eventType) {
    case 'checkout.session.completed':
      parsedEventType = 'payment.completed';
      break;
    case 'checkout.session.expired':
      parsedEventType = 'payment.cancelled';
      break;
    case 'payment_intent.payment_failed':
      parsedEventType = 'payment.failed';
      break;
    default:
      return null;
  }
  
  return {
    eventType: parsedEventType,
    transactionId: session.id || session.payment_intent,
    bookingId: session.metadata?.booking_id,
    amount: session.amount_total ? session.amount_total / 100 : undefined,
    metadata: session.metadata,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    // SECURITY: Webhook secret is mandatory - reject if not configured
    if (!stripeWebhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured - rejecting webhook');
      return new Response(JSON.stringify({ error: 'Webhook configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // SECURITY: Signature header is required
    const stripeSignature = req.headers.get('stripe-signature');
    if (!stripeSignature) {
      console.error('Missing stripe-signature header');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const rawBody = await req.text();
    
    // SECURITY: Always verify signature before processing
    const isValid = await verifyStripeSignature(rawBody, stripeSignature, stripeWebhookSecret);
    if (!isValid) {
      console.error('Invalid Stripe signature - rejecting webhook');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const body = JSON.parse(rawBody);
    
    console.log('Received verified Stripe webhook:', body.type);

    // Parse the webhook event
    const event = parseStripeWebhook(body);
    
    if (!event) {
      console.log('Unhandled event type:', body.type);
      return new Response(JSON.stringify({ received: true, message: 'Event type not handled' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log('Parsed event:', event);

    // Find the transaction by gateway_transaction_id
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('gateway_transaction_id', event.transactionId)
      .maybeSingle();

    if (txError) {
      console.error('Error finding transaction:', txError);
    }

    if (!transaction) {
      console.log('Transaction not found for:', event.transactionId);
      return new Response(JSON.stringify({ received: true, message: 'Transaction not found' }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update transaction status
    let newStatus: string;
    switch (event.eventType) {
      case 'payment.completed':
        newStatus = 'completed';
        break;
      case 'payment.failed':
        newStatus = 'failed';
        break;
      case 'payment.cancelled':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'unknown';
    }

    const { error: updateTxError } = await supabase
      .from('payment_transactions')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id);

    if (updateTxError) {
      console.error('Failed to update transaction:', updateTxError);
    }

    console.log(`Transaction ${transaction.id} updated to status: ${newStatus}`);

    // If commission payment completed, the lessor can now confirm the booking
    // We don't auto-confirm - the lessor still needs to manually confirm
    if (event.eventType === 'payment.completed' && transaction.booking_id) {
      console.log(`Commission paid for booking ${transaction.booking_id} - lessor can now confirm`);
      
      // Optionally send notification to lessor that they can now confirm
      // For now, just log it - the frontend will check transaction status
    }

    return new Response(JSON.stringify({ 
      received: true, 
      transactionId: transaction.id,
      status: newStatus 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
