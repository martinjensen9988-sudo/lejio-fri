import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface Geofence {
  id: string;
  vehicle_id: string;
  name: string;
  center_latitude: number;
  center_longitude: number;
  radius_meters: number;
  geofence_type: 'circle' | 'polygon';
  polygon_coordinates: number[][] | null;
  is_active: boolean;
  alert_on_exit: boolean;
  alert_on_enter: boolean;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    registration: string;
  };
}

export interface GeofenceAlert {
  id: string;
  geofence_id: string;
  device_id: string;
  alert_type: 'exit' | 'enter';
  latitude: number;
  longitude: number;
  is_read: boolean;
  created_at: string;
  geofence?: Geofence;
}

export const useGeofences = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: geofences = [], isLoading } = useQuery({
    queryKey: ['geofences', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('geofences')
        .select(`
          *,
          vehicle:vehicles(id, make, model, registration)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Geofence[];
    },
    enabled: !!user,
  });

  const addGeofence = useMutation({
    mutationFn: async (data: {
      vehicle_id: string;
      name: string;
      center_latitude: number;
      center_longitude: number;
      radius_meters: number;
      geofence_type?: 'circle' | 'polygon';
      polygon_coordinates?: number[][] | null;
      alert_on_exit?: boolean;
      alert_on_enter?: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('geofences')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence oprettet');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const updateGeofence = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Geofence> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('geofences')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence opdateret');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const deleteGeofence = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('geofences')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      toast.success('Geofence slettet');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  return {
    geofences,
    isLoading,
    addGeofence,
    updateGeofence,
    deleteGeofence,
  };
};

export const useGeofenceAlerts = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['geofence-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('geofence_alerts')
        .select(`
          *,
          geofence:geofences(
            *,
            vehicle:vehicles(id, make, model, registration)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as GeofenceAlert[];
    },
    enabled: !!user,
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('geofence_alerts')
        .update({ is_read: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-alerts'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('geofence_alerts')
        .update({ is_read: true })
        .in('id', unreadIds);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-alerts'] });
      toast.success('Alle alarmer markeret som læst');
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('geofence-alerts-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'geofence_alerts',
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['geofence-alerts'] });
          toast.warning('Ny geofence-alarm!', {
            description: `Køretøj har krydset en grænse`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    alerts,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
};
