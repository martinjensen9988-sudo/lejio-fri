import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Webhook handler for Twilio call status updates
const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse form data from Twilio
    const formData = await req.formData();
    const callSid = formData.get("CallSid")?.toString();
    const callStatus = formData.get("CallStatus")?.toString();
    const duration = formData.get("CallDuration")?.toString();
    const from = formData.get("From")?.toString();
    const to = formData.get("To")?.toString();
    const direction = formData.get("Direction")?.toString();

    console.log(`Call webhook: ${callSid} - ${callStatus} - Duration: ${duration}s`);

    // Store call log
    await supabase.from("crm_call_logs").insert({
      call_sid: callSid,
      status: callStatus,
      duration_seconds: duration ? parseInt(duration) : null,
      from_number: from,
      to_number: to,
      direction: direction || "outbound-api",
    });

    // Update related activity if call completed
    if (callStatus === "completed" && duration) {
      // Find the activity with this call in the description
      const { data: activities } = await supabase
        .from("crm_activities")
        .select("id")
        .eq("activity_type", "call")
        .eq("outcome", "started")
        .order("created_at", { ascending: false })
        .limit(1);

      if (activities && activities.length > 0) {
        await supabase
          .from("crm_activities")
          .update({
            outcome: "completed",
            duration_minutes: Math.ceil(parseInt(duration) / 60),
            description: `Opkald afsluttet - varighed: ${duration} sekunder`,
          })
          .eq("id", activities[0].id);
      }
    }

    // Return TwiML response (required by Twilio)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/xml" } 
      }
    );
  } catch (error: unknown) {
    console.error("Error in twilio-call-webhook:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/xml" } }
    );
  }
};

serve(handler);
