import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("cf-connecting-ip") || 
                     "unknown";
    
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action, sessionId, sessionToken, content } = body;

    // Validate sessionId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (action === "create") {
      // Create a new chat session with a secure token
      const token = crypto.randomUUID();
      const tokenHash = await hashToken(token);
      
      const { data: session, error } = await supabase
        .from("visitor_chat_sessions")
        .insert({ session_token_hash: tokenHash })
        .select("id, session_status, needs_human_support")
        .single();

      if (error) {
        console.error("Create session error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create session" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ session, token }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get" || action === "messages" || action === "request_human" || action === "send_message") {
      if (!sessionId || !sessionToken) {
        return new Response(
          JSON.stringify({ error: "Session ID and token required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!uuidRegex.test(sessionId)) {
        return new Response(
          JSON.stringify({ error: "Invalid session ID format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate session token
      const tokenHash = await hashToken(sessionToken);
      const { data: session, error: sessionError } = await supabase
        .from("visitor_chat_sessions")
        .select("id, session_status, needs_human_support, session_token_hash")
        .eq("id", sessionId)
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ error: "Session not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify token matches
      if (session.session_token_hash !== tokenHash) {
        console.log("Token mismatch for session:", sessionId);
        return new Response(
          JSON.stringify({ error: "Invalid session token" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "get") {
        // Return session without token hash
        const { session_token_hash, ...safeSession } = session;
        return new Response(
          JSON.stringify({ session: safeSession }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "messages") {
        const { data: messages, error: msgError } = await supabase
          .from("visitor_chat_messages")
          .select("id, sender_type, content, created_at")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true });

        if (msgError) {
          console.error("Get messages error:", msgError);
          return new Response(
            JSON.stringify({ error: "Failed to fetch messages" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ messages: messages || [] }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "request_human") {
        // Update session to request human support - uses service role key so bypasses RLS
        const { error: updateError } = await supabase
          .from("visitor_chat_sessions")
          .update({ 
            needs_human_support: true, 
            session_status: "waiting_for_agent",
            updated_at: new Date().toISOString()
          })
          .eq("id", sessionId);

        if (updateError) {
          console.error("Update session error:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update session" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "send_message") {
        // content is already extracted from body at the top

        if (!content || typeof content !== "string" || content.length > 2000) {
          return new Response(
            JSON.stringify({ error: "Invalid message content" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert message using service role key - bypasses RLS
        const { error: msgError } = await supabase
          .from("visitor_chat_messages")
          .insert({
            session_id: sessionId,
            sender_type: "visitor",
            content: content.trim()
          });

        if (msgError) {
          console.error("Insert message error:", msgError);
          return new Response(
            JSON.stringify({ error: "Failed to send message" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat session error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple SHA-256 hash function for token verification
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
