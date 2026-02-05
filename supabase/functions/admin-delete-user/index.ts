import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-DELETE-USER] ${step}${detailsStr}`);
};

// UUID validation helper
const isValidUUID = (id: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const body = await req.json();
    const { userId } = body;
    
    // Validate userId is provided
    if (!userId) {
      throw new Error("userId is required");
    }
    
    // Validate userId is a valid UUID format
    if (!isValidUUID(userId)) {
      logStep("Invalid UUID format", { userId });
      throw new Error("Invalid userId format - must be a valid UUID");
    }
    
    logStep("User ID to delete", { userId });

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify the requester is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error("Unauthorized");
    }

    // Verify the requester has super_admin role
    const { data: hasAdminRole, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'super_admin'
    });

    if (roleError) {
      logStep("Role check error", { error: roleError.message });
      throw new Error("Failed to verify admin permissions");
    }

    if (!hasAdminRole) {
      logStep("Unauthorized access attempt", { requesterId: userData.user.id });
      throw new Error("Unauthorized: Super admin role required to delete users");
    }

    logStep("Super admin verified", { requesterId: userData.user.id });

    // Prevent self-deletion
    if (userId === userData.user.id) {
      logStep("Self-deletion attempt blocked", { userId });
      throw new Error("Cannot delete your own account");
    }

    // Verify user exists before proceeding with deletion
    const { data: userExists, error: userExistsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();

    if (userExistsError || !userExists) {
      logStep("User not found", { userId, error: userExistsError?.message });
      throw new Error("User not found");
    }

    logStep("User found, proceeding with deletion", { 
      userId, 
      email: userExists.email,
      fullName: userExists.full_name 
    });

    // Step 1: Delete user's vehicles first (and related bookings, contracts, etc.)
    const { data: vehicles, error: vehiclesQueryError } = await supabaseAdmin
      .from('vehicles')
      .select('id')
      .eq('owner_id', userId);

    if (vehiclesQueryError) {
      logStep("Error fetching vehicles", { error: vehiclesQueryError.message });
    } else if (vehicles && vehicles.length > 0) {
      logStep("Found vehicles to delete", { count: vehicles.length });
      
      const vehicleIds = vehicles.map(v => v.id);
      
      // Delete related bookings first
      const { error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .delete()
        .in('vehicle_id', vehicleIds);
      
      if (bookingsError) {
        logStep("Error deleting bookings", { error: bookingsError.message });
      } else {
        logStep("Deleted related bookings");
      }

      // Delete the vehicles
      const { error: vehiclesError } = await supabaseAdmin
        .from('vehicles')
        .delete()
        .eq('owner_id', userId);

      if (vehiclesError) {
        logStep("Error deleting vehicles", { error: vehiclesError.message });
      } else {
        logStep("Deleted vehicles");
      }
    }

    // Step 2: Delete user's bookings as renter
    const { error: renterBookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('renter_id', userId);

    if (renterBookingsError) {
      logStep("Error deleting renter bookings", { error: renterBookingsError.message });
    }

    // Step 3: Delete user's bookings as lessor
    const { error: lessorBookingsError } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('lessor_id', userId);

    if (lessorBookingsError) {
      logStep("Error deleting lessor bookings", { error: lessorBookingsError.message });
    }

    // Step 4: Delete profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      logStep("Error deleting profile", { error: profileError.message });
      throw new Error(`Failed to delete profile: ${profileError.message}`);
    }
    logStep("Profile deleted");

    // Step 5: Delete auth user
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      logStep("Error deleting auth user", { error: authError.message });
      throw new Error(`Failed to delete auth user: ${authError.message}`);
    }
    logStep("Auth user deleted");

    logStep("User fully deleted", { userId });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
