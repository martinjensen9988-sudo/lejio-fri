import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface GpsDevice {
  id: string;
  vehicle_id: string;
  device_id: string;
  provider: string;
  device_name: string | null;
  is_active: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GpsDataPoint {
  id: string;
  device_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  altitude: number | null;
  odometer: number | null;
  ignition_on: boolean | null;
  fuel_level: number | null;
  battery_level: number | null;
  recorded_at: string;
  created_at: string;
}

export interface GpsDeviceWithLatest extends GpsDevice {
  latest_position?: GpsDataPoint;
  vehicle?: {
    id: string;
    make: string;
    model: string;
    registration: string;
  };
}

export const useGpsDevices = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['gps-devices', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('gps_devices')
        .select(`
          *,
          vehicle:vehicles(id, make, model, registration)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get latest position for each device
      const devicesWithPosition: GpsDeviceWithLatest[] = await Promise.all(
        (data || []).map(async (device: GpsDevice & { vehicle: { id: string; make: string; model: string; registration: string } }) => {
          const { data: latestPoint } = await supabase
            .from('gps_data_points')
            .select('*')
            .eq('device_id', device.id)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...device,
            latest_position: latestPoint || undefined,
          };
        })
      );

      return devicesWithPosition;
    },
    enabled: !!user,
  });

  const addDevice = useMutation({
    mutationFn: async (data: { vehicle_id: string; device_id: string; provider: string; device_name?: string }) => {
      const { data: result, error } = await supabase
        .from('gps_devices')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] });
      toast.success('GPS-enhed tilføjet');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const updateDevice = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; device_name?: string; is_active?: boolean }) => {
      const { data: result, error } = await supabase
        .from('gps_devices')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] });
      toast.success('GPS-enhed opdateret');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gps_devices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gps-devices'] });
      toast.success('GPS-enhed slettet');
    },
    onError: (error: Error) => {
      toast.error(`Fejl: ${error.message}`);
    },
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('gps-data-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'gps_data_points',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['gps-devices'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    devices,
    isLoading,
    refetch,
    addDevice,
    updateDevice,
    deleteDevice,
  };
};

export const useGpsHistory = (deviceId: string | null, limit = 100) => {
  return useQuery({
    queryKey: ['gps-history', deviceId, limit],
    queryFn: async () => {
      if (!deviceId) return [];

      const { data, error } = await supabase
        .from('gps_data_points')
        .select('*')
        .eq('device_id', deviceId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as GpsDataPoint[];
    },
    enabled: !!deviceId,
  });
};
