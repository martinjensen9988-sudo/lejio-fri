import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Handler for incoming Twilio calls
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
    const from = formData.get("From")?.toString();
    const to = formData.get("To")?.toString();
    const callerName = formData.get("CallerName")?.toString();

    console.log(`Incoming call: ${callSid} from ${from} to ${to}`);

    // Log the incoming call
    await supabase.from("crm_call_logs").insert({
      call_sid: callSid,
      status: "ringing",
      from_number: from,
      to_number: to,
      direction: "inbound",
    });

    // Try to match caller to a lead/deal
    let greeting = "Velkommen til Lejio. ";
    
    if (from) {
      // Check if we have a lead with this phone number
      const { data: leads } = await supabase
        .from("sales_leads")
        .select("company_name, contact_name")
        .eq("phone", from)
        .limit(1);

      if (leads && leads.length > 0) {
        const lead = leads[0];
        greeting = `Velkommen ${lead.contact_name || lead.company_name}. `;
      }

      // Also check CRM deals
      const { data: deals } = await supabase
        .from("crm_deals")
        .select("contact_name, company_name")
        .eq("contact_phone", from)
        .limit(1);

      if (deals && deals.length > 0) {
        const deal = deals[0];
        greeting = `Velkommen ${deal.contact_name || deal.company_name}. `;
      }
    }

    // Return TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="da-DK" voice="alice">${greeting}Du er nu forbundet til vores support. Vent venligst mens vi finder en medarbejder.</Say>
  <Play>https://api.twilio.com/cowbell.mp3</Play>
  <Say language="da-DK" voice="alice">Tak for din henvendelse. Vi ringer dig op snarest.</Say>
</Response>`;

    return new Response(twiml, { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/xml" } 
    });
  } catch (error: unknown) {
    console.error("Error in twilio-incoming-call:", error);
    
    // Return a basic TwiML response even on error
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="da-DK" voice="alice">Beklager, der opstod en fejl. Prøv venligst igen senere.</Say>
</Response>`;
    
    return new Response(fallbackTwiml, { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/xml" } 
    });
  }
};

serve(handler);
