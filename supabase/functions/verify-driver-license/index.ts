import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Declare EdgeRuntime for TypeScript
declare const EdgeRuntime: {
  waitUntil: (promise: Promise<unknown>) => void;
} | undefined;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Reduced timeout - faster model means quicker response
const AI_TIMEOUT_MS = 15000;

interface VerificationResult {
  full_name?: string;
  license_number?: string;
  issue_date?: string;
  expiry_date?: string;
  country?: string;
  categories?: string[];
  is_valid: boolean;
  concerns: string[];
  confidence_score: number;
  error?: string;
}

async function verifyWithAI(
  frontImageUrl: string, 
  backImageUrl: string | null, 
  lovableApiKey: string
): Promise<{ result: VerificationResult; timedOut: boolean }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    console.log("[LICENSE] Starting AI verification...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        // Use faster model for quicker verification
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this driver's license image quickly. Extract:
1. Full name
2. License number
3. Expiry date (YYYY-MM-DD)
4. Is this a valid, unexpired license? (true/false)
5. Any concerns (expired, damaged, fake)

Return ONLY valid JSON:
{"full_name":"","license_number":"","expiry_date":"","is_valid":true,"concerns":[],"confidence_score":85}

Be fast and concise. If unclear, set confidence_score lower.`
              },
              {
                type: "image_url",
                image_url: { url: frontImageUrl }
              },
              ...(backImageUrl ? [{
                type: "image_url",
                image_url: { url: backImageUrl }
              }] : [])
            ]
          }
        ],
        max_tokens: 500, // Reduced for faster response
        temperature: 0.1, // Lower temp for more consistent output
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[LICENSE] AI request failed:", response.status, errorText);
      throw new Error(`AI request failed: ${response.statusText}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    console.log("[LICENSE] AI response received, length:", content.length);

    // Parse the AI response
    let verificationResult: VerificationResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
        // Ensure required fields exist
        verificationResult.is_valid = verificationResult.is_valid ?? false;
        verificationResult.concerns = verificationResult.concerns || [];
        verificationResult.confidence_score = verificationResult.confidence_score || 0;
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[LICENSE] Failed to parse AI response:", parseError);
      console.log("[LICENSE] Raw content:", content.substring(0, 200));
      verificationResult = {
        is_valid: false,
        concerns: ["Could not automatically verify license - sent to admin"],
        confidence_score: 0,
      };
    }

    return { result: verificationResult, timedOut: false };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      console.log("[LICENSE] AI verification timed out after", AI_TIMEOUT_MS, "ms");
      return { 
        result: {
          is_valid: false,
          concerns: ["Verification timed out - sent to admin for manual review"],
          confidence_score: 0,
        }, 
        timedOut: true 
      };
    }
    
    console.error("[LICENSE] AI error:", error.message);
    throw error;
  }
}

async function processVerification(
  supabase: unknown,
  licenseId: string,
  frontImageUrl: string,
  backImageUrl: string | null,
  lovableApiKey: string
) {
  try {
    console.log(`[LICENSE] Processing verification for: ${licenseId}`);
    
    // Call AI with timeout
    const { result: verificationResult, timedOut } = await verifyWithAI(
      frontImageUrl,
      backImageUrl,
      lovableApiKey
    );

    let status: string;
    
    if (timedOut) {
      status = "pending_admin_review";
      console.log("[LICENSE] Timeout, escalating to admin");
    } else {
      // Determine verification status based on AI result
      if (verificationResult.is_valid && verificationResult.confidence_score >= 70) {
        status = "verified";
      } else if (verificationResult.confidence_score >= 50) {
        status = "pending_review";
      } else if (verificationResult.confidence_score >= 30) {
        status = "pending_admin_review";
      } else {
        status = "rejected";
      }
    }

    console.log(`[LICENSE] Final status: ${status}, confidence: ${verificationResult.confidence_score}`);

    // Update the license record
    const { error: updateError } = await supabase
      .from("driver_licenses")
      .update({
        verification_status: status,
        ai_verification_result: verificationResult,
        license_number: verificationResult.license_number || null,
        expiry_date: verificationResult.expiry_date || null,
        issue_date: verificationResult.issue_date || null,
        verified_at: status === "verified" ? new Date().toISOString() : null,
      })
      .eq("id", licenseId);

    if (updateError) {
      console.error("[LICENSE] Update error:", updateError);
    } else {
      console.log("[LICENSE] Database updated successfully");
    }

    return { status, result: verificationResult, timedOut };
  } catch (error: unknown) {
    console.error("[LICENSE] Error in processing:", error);
    
    // On error, set to pending_admin_review
    await supabase
      .from("driver_licenses")
      .update({
        verification_status: "pending_admin_review",
        ai_verification_result: { 
          error: error.message, 
          concerns: ["AI verification failed - sent to admin"],
          is_valid: false,
          confidence_score: 0,
        },
      })
      .eq("id", licenseId);

    return { 
      status: "pending_admin_review", 
      result: { error: error.message }, 
      timedOut: true 
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("[LICENSE] LOVABLE_API_KEY not configured");
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { licenseId, frontImageUrl, backImageUrl } = await req.json();

    if (!licenseId || !frontImageUrl) {
      throw new Error("Missing required fields: licenseId, frontImageUrl");
    }

    console.log(`[LICENSE] Received verification request for: ${licenseId}`);

    // IMMEDIATELY update status to show processing has started
    await supabase
      .from("driver_licenses")
      .update({ verification_status: "processing" })
      .eq("id", licenseId);

    // Use EdgeRuntime.waitUntil for background processing if available
    // This allows us to return immediately while processing continues
    const processingPromise = processVerification(
      supabase,
      licenseId,
      frontImageUrl,
      backImageUrl,
      lovableApiKey
    );

    // Check if EdgeRuntime is available (Supabase Edge Functions)
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime.waitUntil) {
      // Return immediately, process in background
      EdgeRuntime.waitUntil(processingPromise);
      
      console.log("[LICENSE] Started background processing");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "processing",
          message: "Verification started in background",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Fallback: wait for processing (still faster with new model)
      const result = await processingPromise;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          ...result,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("[LICENSE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
