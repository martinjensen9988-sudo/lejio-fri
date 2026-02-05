import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LEJIO commission rates
const PRIVATE_COMMISSION_RATE = 0.15; // 15% for private lessors
const PRO_BOOKING_FEE = 19; // 19 kr per booking for pro users

// Create Stripe checkout session for LEJIO commission payment
async function createStripeCommissionPayment(
  amount: number,
  currency: string,
  bookingId: string,
  lessorEmail: string,
  returnUrl: string,
  stripeSecretKey: string,
  description: string
): Promise<{ paymentUrl: string; sessionId: string }> {
  const stripe = await import("https://esm.sh/stripe@14.21.0");
  const stripeClient = new stripe.default(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });

  const session = await stripeClient.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: lessorEmail,
    line_items: [{
      price_data: {
        currency: currency.toLowerCase(),
        product_data: {
          name: 'LEJIO Kommission',
          description: description,
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    success_url: `${returnUrl}?payment=success&booking=${bookingId}`,
    cancel_url: `${returnUrl}?payment=cancelled&booking=${bookingId}`,
    metadata: {
      booking_id: bookingId,
      type: 'lejio_commission',
    },
  });

  return {
    paymentUrl: session.url,
    sessionId: session.id,
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
    const lejioStripeKey = Deno.env.get('LEJIO_STRIPE_SECRET_KEY');
    
    // Validate authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create client with user's JWT to verify authentication
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify the user's JWT
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Authenticated user: ${user.id}`);

    // Create service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { bookingId, returnUrl }: { bookingId: string; returnUrl?: string } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: 'Booking ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing LEJIO commission for booking: ${bookingId}`);

    // Fetch booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking lookup failed:', bookingError);
      // Return generic error to prevent booking ID enumeration
      return new Response(JSON.stringify({ error: 'Unable to process request' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authorization check: Only the lessor can initiate payment for their booking
    if (booking.lessor_id !== user.id) {
      console.error(`Authorization failed: User ${user.id} is not the lessor of booking ${bookingId}`);
      return new Response(JSON.stringify({ error: 'Du har ikke tilladelse til at betale for denne booking' }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Authorization passed: User ${user.id} is the lessor`);

    // Fetch lessor profile
    const { data: lessor, error: lessorError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', booking.lessor_id)
      .single();

    if (lessorError || !lessor) {
      console.error('Lessor profile lookup failed:', lessorError);
      // Return generic error to prevent enumeration
      return new Response(JSON.stringify({ error: 'Unable to process request' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine user type and commission
    const isPrivateUser = lessor.user_type === 'privat' || !lessor.cvr_number;
    
    let commissionAmount: number;
    let paymentMode: 'p2p_commission' | 'pro_fee';
    let description: string;

    if (isPrivateUser) {
      // Private users pay 15% commission to LEJIO
      commissionAmount = booking.total_price * PRIVATE_COMMISSION_RATE;
      paymentMode = 'p2p_commission';
      description = `15% kommission for booking af ${booking.total_price} kr`;
      console.log(`Private user - charging 15% commission: ${commissionAmount.toFixed(2)} DKK`);
    } else {
      // Pro users pay fixed 19 kr per booking
      commissionAmount = PRO_BOOKING_FEE;
      paymentMode = 'pro_fee';
      description = `Booking gebyr`;
      console.log(`Pro user - charging fixed fee: ${commissionAmount} DKK`);
    }

    // Check if LEJIO Stripe key is configured
    if (!lejioStripeKey) {
      console.error('LEJIO_STRIPE_SECRET_KEY not configured');
      return new Response(JSON.stringify({ 
        error: 'Payment system not configured',
        message: 'LEJIO betalingssystem er ikke konfigureret'
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Stripe checkout for LEJIO commission
    const baseReturnUrl = returnUrl || `${req.headers.get('origin') || 'https://lejio.dk'}/dashboard`;
    
    const { paymentUrl, sessionId } = await createStripeCommissionPayment(
      commissionAmount,
      'DKK',
      bookingId,
      lessor.email,
      baseReturnUrl,
      lejioStripeKey,
      description
    );

    // Log the commission transaction
    const { error: transactionError } = await supabase
      .from('payment_transactions')
      .insert({
        booking_id: bookingId,
        lessor_id: booking.lessor_id,
        gateway: 'stripe',
        gateway_transaction_id: sessionId,
        amount: commissionAmount,
        currency: 'DKK',
        status: 'pending',
        type: paymentMode === 'p2p_commission' ? 'commission' : 'platform_fee',
        description: paymentMode === 'p2p_commission' 
          ? `LEJIO kommission (15%) for booking ${bookingId.slice(0, 8)}`
          : `LEJIO booking gebyr for booking ${bookingId.slice(0, 8)}`,
      });

    if (transactionError) {
      console.error('Transaction logging error:', transactionError);
    }

    console.log(`Commission payment created - session: ${sessionId}`);

    return new Response(JSON.stringify({
      success: true,
      mode: paymentMode,
      paymentUrl,
      transactionId: sessionId,
      commissionAmount,
      message: paymentMode === 'p2p_commission'
        ? `Betal 15% kommission (${commissionAmount.toFixed(2)} kr) for at godkende bookingen`
        : `Betal booking gebyr (${commissionAmount} kr) for at godkende bookingen`,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error processing payment:", error);
    // Return generic error to avoid leaking internal details
    return new Response(JSON.stringify({ error: 'Payment processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
