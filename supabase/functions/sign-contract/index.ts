import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignRequest {
  contractId: string;
  signature: string; // Base64 encoded signature image
  acceptVanvidskorsel: boolean;
  role: 'lessor' | 'renter';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { contractId, signature, acceptVanvidskorsel, role }: SignRequest = await req.json();

    if (!contractId || !signature) {
      return new Response(JSON.stringify({ error: 'Contract ID and signature are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Signing contract: ${contractId} as ${role}`);

    // Fetch the contract
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      return new Response(JSON.stringify({ error: 'Contract not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify authorization
    if (role === 'lessor' && contract.lessor_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized as lessor' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (role === 'renter' && contract.renter_id && contract.renter_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Not authorized as renter' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};
    const now = new Date().toISOString();

    if (role === 'renter') {
      updateData.renter_signature = signature;
      updateData.renter_signed_at = now;
      updateData.vanvidskørsel_accepted = acceptVanvidskorsel;
      
      // If renter signs, update renter_id if not set
      if (!contract.renter_id) {
        updateData.renter_id = user.id;
      }
      
      // Update status
      if (contract.lessor_signature) {
        updateData.status = 'signed';
      } else {
        updateData.status = 'pending_lessor_signature';
      }
    } else {
      updateData.lessor_signature = signature;
      updateData.lessor_signed_at = now;
      
      // Update status
      if (contract.renter_signature) {
        updateData.status = 'signed';
      } else {
        updateData.status = 'pending_renter_signature';
      }
    }

    // Update the contract
    const { data: updatedContract, error: updateError } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()
      .single();

    if (updateError) {
      console.error('Contract update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to sign contract' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If both parties have signed, update the booking status and send emails to both parties
    if (updatedContract.status === 'signed') {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', contract.booking_id);

      console.log(`Booking ${contract.booking_id} confirmed`);

      // Send email to BOTH parties when fully signed
      try {
        const functionUrl = `${supabaseUrl}/functions/v1/send-contract-signed`;
        
        // Send to renter
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            contractId,
            signerRole: 'renter',
            bothPartiesSigned: true,
          }),
        });
        console.log('Contract fully signed email sent to renter');

        // Send to lessor
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            contractId,
            signerRole: 'lessor',
            bothPartiesSigned: true,
          }),
        });
        console.log('Contract fully signed email sent to lessor');
      } catch (emailError) {
        console.error('Failed to send contract signed emails:', emailError);
        // Don't fail the signing if email fails
      }
    } else {
      // Send email confirmation to the party that just signed
      try {
        const functionUrl = `${supabaseUrl}/functions/v1/send-contract-signed`;
        await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            contractId,
            signerRole: role,
            bothPartiesSigned: false,
          }),
        });
        console.log(`Contract signed email sent to ${role}`);
      } catch (emailError) {
        console.error('Failed to send contract signed email:', emailError);
        // Don't fail the signing if email fails
      }
    }

    console.log(`Contract ${contractId} signed by ${role}`);

    return new Response(JSON.stringify({ contract: updatedContract }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sign-contract function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
