import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DispatchRecommendation {
  id: string;
  vehicle_id: string | null;
  from_location_id: string | null;
  to_location_id: string | null;
  recommendation_type: string;
  priority: string;
  reason: string;
  expected_revenue_increase: number | null;
  ai_confidence: number | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  vehicle?: {
    make: string;
    model: string;
    registration_number: string;
  };
  from_location?: {
    name: string;
    city: string;
  };
  to_location?: {
    name: string;
    city: string;
  };
}

export interface SearchDemand {
  location_id: string;
  location_name: string;
  vehicle_type: string;
  search_count: number;
  available_count: number;
  demand_score: number;
}

export const useAutoDispatch = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<DispatchRecommendation[]>([]);
  const [searchDemand, setSearchDemand] = useState<SearchDemand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchRecommendations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('fleet_dispatch_recommendations')
        .select('*')
        .eq('lessor_id', user.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendations((data || []) as unknown as DispatchRecommendation[]);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchSearchDemand = useCallback(async () => {
    if (!user) return;

    try {
      // Get search history for last 7 days grouped by location
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: searches, error: searchError } = await supabase
        .from('search_history')
        .select('location_id, vehicle_type')
        .gte('searched_at', sevenDaysAgo.toISOString());

      if (searchError) throw searchError;
      const searchData = (searches || []);

      // Get locations for this lessor
      const { data: locations, error: locError } = await supabase
        .from('dealer_locations')
        .select('id, name, city')
        .eq('partner_id', user.id);

      if (locError) throw locError;
      const locationData = (locations || []);

      // Get available vehicles per location
      const { data: vehicles, error: vehError } = await supabase
        .from('vehicles')
        .select('id, current_location_id, vehicle_type')
        .eq('owner_id', user.id)
        .eq('is_available', true);

      if (vehError) throw vehError;

      // Calculate demand per location
      const demandMap = new Map<string, SearchDemand>();

      locationData.forEach((loc: unknown) => {
        const searchCount = searchData.filter((s: unknown) => s.location_id === loc.id).length || 0;
        const availableCount = vehicles?.filter(v => v.current_location_id === loc.id).length || 0;
        const demandScore = searchCount > 0 && availableCount === 0 
          ? searchCount * 2 
          : searchCount / Math.max(availableCount, 1);

        demandMap.set(loc.id, {
          location_id: loc.id,
          location_name: `${loc.name}, ${loc.city}`,
          vehicle_type: 'all',
          search_count: searchCount,
          available_count: availableCount,
          demand_score: demandScore
        });
      });

      setSearchDemand(Array.from(demandMap.values()).sort((a, b) => b.demand_score - a.demand_score));
    } catch (err) {
      console.error('Error fetching search demand:', err);
    }
  }, [user]);

  const analyzeAndRecommend = async () => {
    if (!user) return;
    setIsAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-fleet-dispatch', {
        body: { lessor_id: user.id }
      });

      if (error) throw error;

      toast.success(`${data.recommendations_created || 0} nye anbefalinger genereret`);
      await fetchRecommendations();
    } catch (err) {
      console.error('Error analyzing fleet:', err);
      toast.error('Kunne ikke analysere flåden');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateRecommendationStatus = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('fleet_dispatch_recommendations')
        .update({ status, acted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setRecommendations(prev => prev.filter(r => r.id !== id));
      toast.success(status === 'accepted' ? 'Anbefaling accepteret' : 'Anbefaling afvist');
    } catch (err) {
      console.error('Error updating recommendation:', err);
      toast.error('Kunne ikke opdatere anbefaling');
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchSearchDemand();
  }, [fetchRecommendations, fetchSearchDemand]);

  return {
    recommendations,
    searchDemand,
    isLoading,
    isAnalyzing,
    analyzeAndRecommend,
    updateRecommendationStatus,
    refetch: fetchRecommendations
  };
};
