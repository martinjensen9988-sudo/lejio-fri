import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message_id, message_content, target_language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Detect source language and translate
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `Du er en oversætter. Oversæt den givne besked til ${target_language}. 
            Svar KUN med oversættelsen, intet andet. Bevar emoji og formattering.
            Hvis beskeden allerede er på ${target_language}, returner den uændret.`
          },
          {
            role: "user",
            content: message_content
          }
        ],
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const translatedContent = data.choices?.[0]?.message?.content?.trim();

    // Detect original language
    const detectResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: "Detect the language of the following text. Reply with ONLY the ISO 639-1 language code (e.g., 'da', 'en', 'de', 'pl')."
          },
          {
            role: "user",
            content: message_content
          }
        ],
        temperature: 0
      }),
    });

    let originalLanguage = "unknown";
    if (detectResponse.ok) {
      const detectData = await detectResponse.json();
      originalLanguage = detectData.choices?.[0]?.message?.content?.trim()?.toLowerCase() || "unknown";
    }

    // Update message with translation if message_id provided
    if (message_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      await supabase
        .from("messages")
        .update({
          translated_content: translatedContent,
          original_language: originalLanguage,
          target_language: target_language
        })
        .eq("id", message_id);
    }

    return new Response(
      JSON.stringify({
        translated_content: translatedContent,
        original_language: originalLanguage,
        target_language
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in translate-message:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
