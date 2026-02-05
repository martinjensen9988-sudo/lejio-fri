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
    const { lessor_id } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get lessor's locations
    const { data: locations, error: locError } = await supabase
      .from("dealer_locations")
      .select("id, name, city")
      .eq("partner_id", lessor_id)
      .eq("is_active", true);

    if (locError) throw locError;

    if (!locations || locations.length < 2) {
      return new Response(
        JSON.stringify({ message: "Need at least 2 locations for dispatch analysis", recommendations_created: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get search history for last 14 days
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: searches } = await supabase
      .from("search_history")
      .select("location_id, vehicle_type, start_date")
      .in("location_id", locations.map(l => l.id))
      .gte("searched_at", fourteenDaysAgo.toISOString());

    // Get lessor's vehicles with current location
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, make, model, vehicle_type, current_location_id, is_available")
      .eq("owner_id", lessor_id);

    // Get upcoming bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("vehicle_id, start_date, end_date")
      .eq("lessor_id", lessor_id)
      .in("status", ["pending", "confirmed"])
      .gte("start_date", new Date().toISOString());

    // Analyze demand vs supply per location
    const locationStats = new Map<string, {
      location: unknown;
      searchCount: number;
      availableVehicles: number;
      upcomingBookings: number;
      demandScore: number;
    }>();

    locations.forEach(loc => {
      const searchCount = searches?.filter(s => s.location_id === loc.id).length || 0;
      const availableVehicles = vehicles?.filter(v => 
        v.current_location_id === loc.id && v.is_available
      ).length || 0;
      const vehicleIds = vehicles?.filter(v => v.current_location_id === loc.id).map(v => v.id) || [];
      const upcomingBookings = bookings?.filter(b => vehicleIds.includes(b.vehicle_id)).length || 0;

      // Calculate demand score (higher = more demand, less supply)
      const supplyFactor = Math.max(availableVehicles - upcomingBookings, 0);
      const demandScore = searchCount / Math.max(supplyFactor, 0.5);

      locationStats.set(loc.id, {
        location: loc,
        searchCount,
        availableVehicles,
        upcomingBookings,
        demandScore
      });
    });

    // Sort locations by demand score
    const sortedLocations = Array.from(locationStats.values())
      .sort((a, b) => b.demandScore - a.demandScore);

    // Generate recommendations using AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const analysisPrompt = `
    Du er en flådeoptimerings-AI for biludlejning. Analyser følgende data og generer anbefalinger:

    Lokationer (sorteret efter efterspørgsel):
    ${sortedLocations.map(s => `
    - ${s.location.name}, ${s.location.city}: 
      Søgninger: ${s.searchCount}, Ledige biler: ${s.availableVehicles}, 
      Kommende bookinger: ${s.upcomingBookings}, Score: ${s.demandScore.toFixed(2)}
    `).join('')}

    Tilgængelige køretøjer:
    ${vehicles?.filter(v => v.is_available).map(v => `
    - ${v.make} ${v.model} (${v.vehicle_type}) - Lokation: ${locations.find(l => l.id === v.current_location_id)?.name || 'Ukendt'}
    `).join('')}

    Generer JSON med anbefalinger for at flytte biler fra lokationer med lavt demand til højt demand.
    Returner PRÆCIS dette format:
    {
      "recommendations": [
        {
          "vehicle_id": "uuid",
          "from_location_id": "uuid",
          "to_location_id": "uuid",
          "priority": "high|medium|low",
          "reason": "Kort forklaring på dansk",
          "expected_revenue_increase": number,
          "confidence": 0.0-1.0
        }
      ]
    }
    
    Maksimalt 5 anbefalinger. Kun anbefal flytninger der giver mening.
    `;

    let recommendations: Record<string, unknown>[] = [];

    if (LOVABLE_API_KEY && sortedLocations.length >= 2) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Du er en flådeoptimerings-AI. Svar KUN med valid JSON." },
              { role: "user", content: analysisPrompt }
            ],
            temperature: 0.3
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;
          
          // Extract JSON from response
          const jsonMatch = content?.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            recommendations = parsed.recommendations || [];
          }
        }
      } catch (aiError) {
        console.error("AI analysis error:", aiError);
      }
    }

    // If no AI recommendations, generate basic rule-based ones
    if (recommendations.length === 0 && sortedLocations.length >= 2) {
      const highDemand = sortedLocations[0];
      const lowDemand = sortedLocations[sortedLocations.length - 1];

      if (highDemand.demandScore > 2 && lowDemand.availableVehicles > 1) {
        const vehicleToMove = vehicles?.find(v => 
          v.current_location_id === lowDemand.location.id && v.is_available
        );

        if (vehicleToMove) {
          recommendations.push({
            vehicle_id: vehicleToMove.id,
            from_location_id: lowDemand.location.id,
            to_location_id: highDemand.location.id,
            priority: "high",
            reason: `${highDemand.searchCount} søgninger i ${highDemand.location.city} men kun ${highDemand.availableVehicles} ledige biler`,
            expected_revenue_increase: highDemand.searchCount * 200,
            confidence: 0.75
          });
        }
      }
    }

    // Insert recommendations
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    for (const rec of recommendations) {
      await supabase.from("fleet_dispatch_recommendations").insert({
        lessor_id,
        vehicle_id: rec.vehicle_id,
        from_location_id: rec.from_location_id,
        to_location_id: rec.to_location_id,
        recommendation_type: "move",
        priority: rec.priority || "medium",
        reason: rec.reason,
        expected_revenue_increase: rec.expected_revenue_increase,
        ai_confidence: rec.confidence,
        expires_at: expiresAt.toISOString()
      });
    }

    return new Response(
      JSON.stringify({ 
        message: "Analysis complete",
        recommendations_created: recommendations.length,
        location_stats: sortedLocations.map(s => ({
          location: s.location.name,
          demand_score: s.demandScore
        }))
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-fleet-dispatch:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
