import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_favorites')
        .select('vehicle_id')
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(data?.map(f => f.vehicle_id) || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const addFavorite = async (vehicleId: string) => {
    if (!user) {
      toast.error('Du skal være logget ind for at gemme favoritter');
      return false;
    }

    try {
      const { error } = await supabase
        .from('vehicle_favorites')
        .insert({ user_id: user.id, vehicle_id: vehicleId });

      if (error) throw error;

      setFavorites(prev => [...prev, vehicleId]);
      toast.success('Tilføjet til favoritter');
      return true;
    } catch (error: unknown) {
      if (error.code === '23505') {
        toast.info('Allerede i favoritter');
      } else {
        console.error('Error adding favorite:', error);
        toast.error('Kunne ikke tilføje til favoritter');
      }
      return false;
    }
  };

  const removeFavorite = async (vehicleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('vehicle_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('vehicle_id', vehicleId);

      if (error) throw error;

      setFavorites(prev => prev.filter(id => id !== vehicleId));
      toast.success('Fjernet fra favoritter');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Kunne ikke fjerne fra favoritter');
      return false;
    }
  };

  const toggleFavorite = async (vehicleId: string) => {
    if (favorites.includes(vehicleId)) {
      return removeFavorite(vehicleId);
    } else {
      return addFavorite(vehicleId);
    }
  };

  const isFavorite = (vehicleId: string) => favorites.includes(vehicleId);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
};
