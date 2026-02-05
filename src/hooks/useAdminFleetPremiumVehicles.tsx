import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { FleetVehicleStats, FleetPremiumSummary } from './useFleetPremiumVehicles';

export interface FleetCustomerWithVehicles {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  fleet_plan: string | null;
  fleet_commission_rate: number | null;
  vehicles: FleetVehicleStats[];
  summary: FleetPremiumSummary;
}

export const useAdminFleetPremiumVehicles = () => {
  const [customers, setCustomers] = useState<FleetCustomerWithVehicles[]>([]);
  const [allVehicles, setAllVehicles] = useState<FleetVehicleStats[]>([]);
  const [globalSummary, setGlobalSummary] = useState<FleetPremiumSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastCalculatedAt, setLastCalculatedAt] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const GUARANTEE_DAYS = 300;

  const fetchFromCache = useCallback(async () => {
    setIsLoading(true);
    try {
      const cacheKey = `fleet_stats_${selectedYear}_${selectedMonth}`;
      
      const { data: cacheData, error: cacheError } = await supabase
        .from('fleet_premium_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .single();

      if (cacheError || !cacheData) {
        console.log('No cache found, data will be available after next scheduled calculation');
        setCustomers([]);
        setAllVehicles([]);
        setGlobalSummary(null);
        setLastCalculatedAt(null);
        setIsLoading(false);
        return;
      }

      // Parse the JSONB data with proper typing
      const rawData = cacheData.data as unknown as {
        customers: FleetCustomerWithVehicles[];
        allVehicles: FleetVehicleStats[];
        globalSummary: FleetPremiumSummary | null;
        totalCustomers: number;
      };
      
      setCustomers(rawData.customers || []);
      setAllVehicles(rawData.allVehicles || []);
      setGlobalSummary(rawData.globalSummary);
      setLastCalculatedAt(cacheData.calculated_at);

    } catch (error) {
      console.error('Error fetching fleet cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Trigger recalculation manually (for admin use)
  const triggerRecalculation = useCallback(async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('calculate-fleet-premium-stats');
      if (error) throw error;
      
      // Wait a moment for the cache to be updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch from cache
      await fetchFromCache();
    } catch (error) {
      console.error('Error triggering recalculation:', error);
      setIsLoading(false);
    }
  }, [fetchFromCache]);

  useEffect(() => {
    fetchFromCache();
  }, [fetchFromCache]);

  return {
    customers,
    allVehicles,
    globalSummary,
    isLoading,
    lastCalculatedAt,
    selectedYear,
    selectedMonth,
    setSelectedYear,
    setSelectedMonth,
    refetch: fetchFromCache,
    triggerRecalculation,
    GUARANTEE_DAYS,
  };
};
