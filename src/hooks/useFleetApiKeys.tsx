import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface FleetApiKey {
  id: string;
  api_key: string;
  name: string | null;
  allowed_origins: string[] | null;
  is_active: boolean;
  requests_count: number;
  last_used_at: string | null;
  created_at: string;
}

export const useFleetApiKeys = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<FleetApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApiKeys = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fleet_api_keys')
        .select('*')
        .eq('fleet_owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente API-nøgler',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, [user]);

  const generateApiKey = async (name: string, allowedOrigins: string[] = []) => {
    if (!user) return null;

    try {
      // Generate API key using database function
      const { data: keyData, error: keyError } = await supabase
        .rpc('generate_fleet_api_key');

      if (keyError) throw keyError;

      const newApiKey = keyData as string;

      // Insert the new API key record
      const { data, error } = await supabase
        .from('fleet_api_keys')
        .insert({
          fleet_owner_id: user.id,
          api_key: newApiKey,
          name: name || null,
          allowed_origins: allowedOrigins.length > 0 ? allowedOrigins : null,
        })
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      
      toast({
        title: 'API-nøgle oprettet',
        description: 'Din nye API-nøgle er klar til brug',
      });

      return data;
    } catch (error) {
      console.error('Error generating API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette API-nøgle',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateApiKey = async (id: string, updates: { name?: string; allowed_origins?: string[]; is_active?: boolean }) => {
    try {
      const { error } = await supabase
        .from('fleet_api_keys')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setApiKeys(prev => prev.map(key => 
        key.id === id ? { ...key, ...updates } : key
      ));

      toast({
        title: 'Opdateret',
        description: 'API-nøgle er blevet opdateret',
      });

      return true;
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere API-nøgle',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fleet_api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== id));

      toast({
        title: 'Slettet',
        description: 'API-nøgle er blevet slettet',
      });

      return true;
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette API-nøgle',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    apiKeys,
    isLoading,
    generateApiKey,
    updateApiKey,
    deleteApiKey,
    refetch: fetchApiKeys,
  };
};
