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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is super admin
    const { data: isAdmin } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'super_admin'
    });

    if (!isAdmin) {
      throw new Error("Only admins can post to Facebook");
    }

    const { message, vehicleId, imageUrl } = await req.json();
    
    const FACEBOOK_PAGE_ACCESS_TOKEN = Deno.env.get("FACEBOOK_PAGE_ACCESS_TOKEN");
    const FACEBOOK_PAGE_ID = Deno.env.get("FACEBOOK_PAGE_ID");

    if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
      throw new Error("Facebook credentials not configured");
    }

    let postUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/feed`;
    let postBody: Record<string, string> = {
      message,
      access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
    };

    // If there's an image, post as photo instead
    if (imageUrl) {
      postUrl = `https://graph.facebook.com/v18.0/${FACEBOOK_PAGE_ID}/photos`;
      postBody = {
        url: imageUrl,
        caption: message,
        access_token: FACEBOOK_PAGE_ACCESS_TOKEN,
      };
    }

    const response = await fetch(postUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(postBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Facebook API error:", result);
      throw new Error(result.error?.message || "Failed to post to Facebook");
    }

    // Log the post to database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    await supabaseAdmin.from("facebook_posts").insert({
      vehicle_id: vehicleId || null,
      post_id: result.id || result.post_id,
      message,
      image_url: imageUrl || null,
      posted_by: user.id,
    });

    return new Response(JSON.stringify({ success: true, postId: result.id || result.post_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
