import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  maintenance_type: string;
  performed_at: string;
  performed_by: string | null;
  odometer_reading: number | null;
  notes: string | null;
  next_service_km: number | null;
  next_service_date: string | null;
  created_at: string;
}

interface MaintenanceLogInsert {
  vehicle_id: string;
  maintenance_type: string;
  performed_by?: string;
  odometer_reading?: number;
  notes?: string;
  next_service_km?: number;
  next_service_date?: string;
}

interface MaintenanceStats {
  chainServiceDue: boolean;
  chainLastCheckedKm: number | null;
  kmSinceChainCheck: number | null;
  tireFrontStatus: 'ok' | 'warn' | 'critical';
  tireRearStatus: 'ok' | 'warn' | 'critical';
  nextServiceDate: string | null;
  nextServiceKm: number | null;
}

const CHAIN_SERVICE_INTERVAL_KM = 1000;

export const useMCMaintenance = (vehicleId: string | null) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (!vehicleId) return;

    setIsLoading(true);
    try {
      // Use type assertion since mc_maintenance_log is a new table not yet in generated types
      const { data, error } = await (supabase
        .from('mc_maintenance_log')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('performed_at', { ascending: false }));

      if (error) throw error;
      setLogs((data || []) as MaintenanceLog[]);
    } catch (error) {
      console.error('Error fetching maintenance logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const addMaintenanceLog = async (
    maintenanceType: string,
    odometerReading?: number,
    notes?: string,
    nextServiceKm?: number,
    nextServiceDate?: string
  ) => {
    if (!vehicleId || !user) {
      toast.error('Du skal være logget ind');
      return null;
    }

    try {
      const insertData: MaintenanceLogInsert = {
        vehicle_id: vehicleId,
        maintenance_type: maintenanceType,
        performed_by: user.id,
        odometer_reading: odometerReading,
        notes,
        next_service_km: nextServiceKm,
        next_service_date: nextServiceDate,
      };

      // Use type assertion since mc_maintenance_log is a new table not yet in generated types
      const { data, error } = await (supabase
        .from('mc_maintenance_log')
        .insert(insertData)
        .select()
        .single());

      if (error) throw error;

      // If chain check, update vehicle table with new MC fields
      if (maintenanceType === 'chain_check' || maintenanceType === 'chain_service') {
        await (supabase
          .from('vehicles')
          .update({
            chain_last_checked_at: new Date().toISOString(),
            chain_last_checked_km: odometerReading,
          })
          .eq('id', vehicleId));
      }

      toast.success('Vedligeholdelse registreret');
      fetchLogs();
      return data as MaintenanceLog;
    } catch (error) {
      console.error('Error adding maintenance log:', error);
      toast.error('Kunne ikke registrere vedligeholdelse');
      return null;
    }
  };

  const getMaintenanceStats = useCallback(async (): Promise<MaintenanceStats | null> => {
    if (!vehicleId) return null;

    try {
      // Use type assertion for new MC-specific fields
      const { data: vehicle, error } = await (supabase
        .from('vehicles')
        .select('current_odometer, chain_last_checked_km, tire_tread_front_mm, tire_tread_rear_mm')
        .eq('id', vehicleId)
        .single());

      if (error) throw error;

      const v = vehicle;
      const currentKm = v?.current_odometer || 0;
      const chainLastKm = v?.chain_last_checked_km || 0;
      const kmSinceChain = currentKm - chainLastKm;

      // Tire status
      const getTireStatus = (mm: number | null): 'ok' | 'warn' | 'critical' => {
        if (!mm) return 'ok';
        if (mm < 1.6) return 'critical';
        if (mm < 3) return 'warn';
        return 'ok';
      };

      // Get latest service log
      const latestService = logs.find(l => l.maintenance_type === 'general_service');

      return {
        chainServiceDue: kmSinceChain >= CHAIN_SERVICE_INTERVAL_KM,
        chainLastCheckedKm: chainLastKm,
        kmSinceChainCheck: kmSinceChain,
        tireFrontStatus: getTireStatus(v?.tire_tread_front_mm),
        tireRearStatus: getTireStatus(v?.tire_tread_rear_mm),
        nextServiceDate: latestService?.next_service_date || null,
        nextServiceKm: latestService?.next_service_km || null,
      };
    } catch (error) {
      console.error('Error getting maintenance stats:', error);
      return null;
    }
  }, [vehicleId, logs]);

  return {
    logs,
    isLoading,
    addMaintenanceLog,
    getMaintenanceStats,
    refetch: fetchLogs,
  };
};

export default useMCMaintenance;
