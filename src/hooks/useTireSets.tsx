import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface TireSet {
  id: string;
  vehicle_id: string;
  tire_type: 'summer' | 'winter' | 'all_season';
  brand: string | null;
  model: string | null;
  size: string;
  dot_code: string | null;
  purchase_date: string | null;
  tread_depth_mm: number | null;
  storage_location: string | null;
  is_mounted: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTireSets = (vehicleId?: string) => {
  const { user } = useAuth();
  const [tireSets, setTireSets] = useState<TireSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTireSets = useCallback(async () => {
    if (!user) {
      setTireSets([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('tire_sets')
        .select('*')
        .order('created_at', { ascending: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setTireSets((data || []).map(ts => ({
        ...ts,
        tire_type: ts.tire_type as TireSet['tire_type']
      })));
    } catch (error) {
      console.error('Error fetching tire sets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, vehicleId]);

  useEffect(() => {
    fetchTireSets();
  }, [fetchTireSets]);

  const addTireSet = async (tireSet: Omit<TireSet, 'id' | 'created_at' | 'updated_at'>): Promise<TireSet | null> => {
    try {
      const { data, error } = await supabase
        .from('tire_sets')
        .insert(tireSet)
        .select()
        .single();

      if (error) throw error;

      const typedData = { ...data, tire_type: data.tire_type as TireSet['tire_type'] };
      setTireSets(prev => [typedData, ...prev]);
      toast.success('Dæksæt tilføjet');
      return typedData;
    } catch (error) {
      console.error('Error adding tire set:', error);
      toast.error('Kunne ikke tilføje dæksæt');
      return null;
    }
  };

  const updateTireSet = async (id: string, updates: Partial<TireSet>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tire_sets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setTireSets(prev => prev.map(ts => ts.id === id ? { ...ts, ...updates } : ts));
      toast.success('Dæksæt opdateret');
      return true;
    } catch (error) {
      console.error('Error updating tire set:', error);
      toast.error('Kunne ikke opdatere dæksæt');
      return false;
    }
  };

  const deleteTireSet = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('tire_sets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTireSets(prev => prev.filter(ts => ts.id !== id));
      toast.success('Dæksæt slettet');
      return true;
    } catch (error) {
      console.error('Error deleting tire set:', error);
      toast.error('Kunne ikke slette dæksæt');
      return false;
    }
  };

  const mountTireSet = async (id: string, vehicleId: string): Promise<boolean> => {
    try {
      // First unmount unknown currently mounted tires for this vehicle
      await supabase
        .from('tire_sets')
        .update({ is_mounted: false })
        .eq('vehicle_id', vehicleId)
        .eq('is_mounted', true);

      // Mount the selected tire set
      const { error } = await supabase
        .from('tire_sets')
        .update({ is_mounted: true })
        .eq('id', id);

      if (error) throw error;

      setTireSets(prev => prev.map(ts => ({
        ...ts,
        is_mounted: ts.id === id ? true : (ts.vehicle_id === vehicleId ? false : ts.is_mounted)
      })));
      toast.success('Dæksæt monteret');
      return true;
    } catch (error) {
      console.error('Error mounting tire set:', error);
      toast.error('Kunne ikke montere dæksæt');
      return false;
    }
  };

  const getMountedTireSet = (vehicleId: string): TireSet | undefined => {
    return tireSets.find(ts => ts.vehicle_id === vehicleId && ts.is_mounted);
  };

  return {
    tireSets,
    isLoading,
    addTireSet,
    updateTireSet,
    deleteTireSet,
    mountTireSet,
    getMountedTireSet,
    refetch: fetchTireSets,
  };
};
