import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MakeCallRequest {
  to: string;
  dealId?: string;
  leadId?: string;
  contactName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { to, dealId, leadId, contactName }: MakeCallRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Telefonnummer er påkrævet" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean phone number
    let cleanPhone = to.replace(/[\s\-()]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.startsWith("45") ? `+${cleanPhone}` : `+45${cleanPhone}`;
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!accountSid || !authToken || !twilioPhone) {
      console.error("Missing Twilio configuration");
      return new Response(
        JSON.stringify({ error: "Twilio er ikke konfigureret" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Initiating call from ${twilioPhone} to ${cleanPhone}`);

    // Make Twilio API call to initiate outbound call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`;
    
    const formData = new URLSearchParams();
    formData.append("To", cleanPhone);
    formData.append("From", twilioPhone);
    // TwiML to connect the agent's phone/browser
    formData.append("Twiml", `<Response><Say language="da-DK">Forbinder opkald til ${contactName || "kunde"}</Say><Dial>${cleanPhone}</Dial></Response>`);

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioData);
      return new Response(
        JSON.stringify({ error: twilioData.message || "Kunne ikke starte opkald" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Call initiated:", twilioData.sid);

    // Log activity in CRM
    if (dealId || leadId) {
      await supabase.from("crm_activities").insert({
        deal_id: dealId || null,
        lead_id: leadId || null,
        activity_type: "call",
        subject: `Udgående opkald til ${contactName || cleanPhone}`,
        description: `Opkald startet via VoIP`,
        outcome: "started",
        created_by: user.id,
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: twilioData.sid,
        message: "Opkald startet",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in twilio-make-call:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Kunne ikke starte opkald" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
