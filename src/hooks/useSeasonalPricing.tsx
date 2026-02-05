import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface SeasonalPricing {
  id: string;
  vehicle_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  fixed_price: number | null;
  is_active: boolean;
}

export const useSeasonalPricing = (vehicleId?: string) => {
  const [pricingRules, setPricingRules] = useState<SeasonalPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPricing = useCallback(async () => {
    if (!vehicleId) {
      setPricingRules([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('seasonal_pricing')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setPricingRules(data || []);
    } catch (error) {
      console.error('Error fetching seasonal pricing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  const addPricingRule = async (rule: Omit<SeasonalPricing, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('seasonal_pricing')
        .insert(rule)
        .select()
        .single();

      if (error) throw error;

      setPricingRules(prev => [...prev, data]);
      toast.success('Sæsonpris tilføjet');
      return data;
    } catch (error) {
      console.error('Error adding pricing rule:', error);
      toast.error('Kunne ikke tilføje sæsonpris');
      return null;
    }
  };

  const updatePricingRule = async (id: string, updates: Partial<SeasonalPricing>) => {
    try {
      const { error } = await supabase
        .from('seasonal_pricing')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setPricingRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success('Sæsonpris opdateret');
      return true;
    } catch (error) {
      console.error('Error updating pricing rule:', error);
      toast.error('Kunne ikke opdatere sæsonpris');
      return false;
    }
  };

  const deletePricingRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('seasonal_pricing')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPricingRules(prev => prev.filter(r => r.id !== id));
      toast.success('Sæsonpris slettet');
      return true;
    } catch (error) {
      console.error('Error deleting pricing rule:', error);
      toast.error('Kunne ikke slette sæsonpris');
      return false;
    }
  };

  const calculatePrice = (basePrice: number, date: Date): number => {
    const activeRule = pricingRules.find(rule => {
      if (!rule.is_active) return false;
      const start = new Date(rule.start_date);
      const end = new Date(rule.end_date);
      return date >= start && date <= end;
    });

    if (!activeRule) return basePrice;

    if (activeRule.fixed_price !== null) {
      return activeRule.fixed_price;
    }

    return basePrice * activeRule.price_multiplier;
  };

  return {
    pricingRules,
    isLoading,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    calculatePrice,
    refetch: fetchPricing,
  };
};
