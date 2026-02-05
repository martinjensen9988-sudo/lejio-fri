import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(clientIP);

  if (record && now > record.resetTime) {
    rateLimitStore.delete(clientIP);
  }

  const currentRecord = rateLimitStore.get(clientIP);

  if (!currentRecord) {
    rateLimitStore.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (currentRecord.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfter: Math.ceil((currentRecord.resetTime - now) / 1000) };
  }

  currentRecord.count++;
  return { allowed: true };
}

// Input validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB max
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

function decodeBase64ToUint8Array(base64: string): Uint8Array {
  const cleaned = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = checkRateLimit(clientIP);
  if (!rateLimitResult.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please try again later." }),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Retry-After": String(rateLimitResult.retryAfter || 60)
        } 
      }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Backend not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify the caller via their Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { vehicleId, imageBase64, contentType, fileExt } = await req.json();
    
    // Input validation
    if (!vehicleId || !imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing vehicleId or image" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate vehicleId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(vehicleId)) {
      return new Response(
        JSON.stringify({ error: "Invalid vehicleId format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate image size
    if (imageBase64.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: "Image exceeds maximum size limit (10MB)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate file extension
    const ext = typeof fileExt === "string" && fileExt.trim() ? fileExt.trim().toLowerCase() : "jpg";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return new Response(
        JSON.stringify({ error: "Invalid file extension. Allowed: jpg, jpeg, png, gif, webp" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const service = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const userId = userData.user.id;

    // Authorization: owner OR admin/support roles
    const [{ data: vehicle }, { data: roles }]: unknown = await Promise.all([
      service.from("vehicles").select("owner_id").eq("id", vehicleId).maybeSingle(),
      service
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["support", "admin", "super_admin"]),
    ]);

    const isAdmin = Array.isArray(roles) && roles.length > 0;
    const ownerId = vehicle?.owner_id as string | undefined;
    const isOwner = !!ownerId && ownerId === userId;

    if (!isOwner && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bytes = decodeBase64ToUint8Array(imageBase64);
    const safeContentType = typeof contentType === "string" && contentType.startsWith("image/")
      ? contentType
      : "image/jpeg";

    const objectPath = `${vehicleId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error: uploadErr } = await service.storage
      .from("vehicle-images")
      .upload(objectPath, bytes, { upsert: true, contentType: safeContentType });

    if (uploadErr) {
      console.error("upload-vehicle-image upload error", uploadErr);
      return new Response(
        JSON.stringify({ error: "Upload failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: urlData } = service.storage.from("vehicle-images").getPublicUrl(objectPath);
    const publicUrl = urlData.publicUrl;

    // Get max display_order for this vehicle
    const { data: existingImages } = await service
      .from("vehicle_images")
      .select("display_order")
      .eq("vehicle_id", vehicleId)
      .order("display_order", { ascending: false })
      .limit(1);

    const maxOrder = existingImages && existingImages.length > 0 
      ? (existingImages[0] ).display_order 
      : -1;

    // Insert into vehicle_images table using service role (bypasses RLS)
    const { data: imageRecord, error: insertErr } = await service
      .from("vehicle_images")
      .insert({
        vehicle_id: vehicleId,
        image_url: publicUrl,
        display_order: maxOrder + 1,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("upload-vehicle-image db insert error", insertErr);
      // Clean up uploaded file
      await service.storage.from("vehicle-images").remove([objectPath]);
      return new Response(
        JSON.stringify({ error: "Failed to save image record" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        publicUrl, 
        objectPath,
        imageId: (imageRecord )?.id,
        displayOrder: (imageRecord )?.display_order,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in upload-vehicle-image:", error);
    const msg = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
