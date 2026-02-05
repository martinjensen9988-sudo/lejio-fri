import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { imageUrl, vehicleType } = await req.json();

    console.log(`[DAMAGE] Analyzing damage for ${vehicleType || "vehicle"}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this vehicle image for unknown damage. Identify:
1. Type of damage (scratch, dent, crack, rust, etc.)
2. Location on the vehicle (front, rear, left side, right side, roof, etc.)
3. Severity (minor, moderate, severe)
4. Estimated repair cost range in DKK
5. Description of the damage

Return the response as a JSON object:
{
  "damages": [
    {
      "type": string,
      "location": string,
      "severity": "minor" | "moderate" | "severe",
      "estimated_cost_min": number,
      "estimated_cost_max": number,
      "description": string
    }
  ],
  "overall_condition": "excellent" | "good" | "fair" | "poor",
  "recommendations": string[],
  "confidence_score": number (0-100)
}

If no damage is detected, return an empty damages array with overall_condition as "excellent".`
              },
              {
                type: "image_url",
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    console.log("[DAMAGE] AI response:", content);

    // Parse the AI response
    let analysisResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[DAMAGE] Failed to parse AI response:", parseError);
      analysisResult = {
        damages: [],
        overall_condition: "unknown",
        recommendations: ["Manual inspection recommended"],
        confidence_score: 0,
      };
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: analysisResult 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[DAMAGE] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
