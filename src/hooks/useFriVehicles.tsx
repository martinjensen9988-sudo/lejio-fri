import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  vin?: string;
  daily_rate?: number;
  availability_status?: 'available' | 'rented' | 'maintenance' | 'retired';
  status?: 'available' | 'rented' | 'maintenance' | 'retired';
  created_at: string;
  updated_at: string;
}

export interface CreateVehicleInput {
  make: string;
  model: string;
  year?: number;
  license_plate: string;
  vin?: string;
  daily_rate?: number;
}

/**
 * Hook to manage lessor's fleet vehicles (Azure SQL)
 */
export function useFriVehicles(lessorId: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch vehicles
  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  const fetch = useCallback(async () => {
    if (!lessorId) return;

    try {
      setLoading(true);
      const safeLessorId = escapeSqlValue(lessorId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT *, status AS availability_status FROM fri_vehicles WHERE lessor_id='${safeLessorId}' ORDER BY created_at DESC`,
      });

      const rows = normalizeRows(response) as Vehicle[];
      setVehicles(rows || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Add vehicle
  const addVehicle = useCallback(
    async (input: CreateVehicleInput) => {
      if (!lessorId) throw new Error('No lessor ID');

      try {
        const safeLessorId = escapeSqlValue(lessorId);
        const columns = [
          'lessor_id',
          'make',
          'model',
          'year',
          'license_plate',
          'vin',
          'daily_rate',
          'status',
          'is_active',
        ];
        const values = [
          `'${safeLessorId}'`,
          `'${escapeSqlValue(input.make)}'`,
          `'${escapeSqlValue(input.model)}'`,
          input.year ?? null,
          `'${escapeSqlValue(input.license_plate)}'`,
          input.vin ? `'${escapeSqlValue(input.vin)}'` : null,
          input.daily_rate ?? null,
          `'available'`,
          1,
        ];

        await azureApi.post('/db/query', {
          query: `INSERT INTO fri_vehicles (${columns.join(', ')}) VALUES (${values.map(v => (v === null ? 'NULL' : v)).join(', ')})`,
        });

        await fetch();
        return null;
      } catch (err) {
        console.error('Error adding vehicle:', err);
        throw err;
      }
    },
    [lessorId]
  );

  // Update vehicle
  const updateVehicle = useCallback(
    async (id: string, updates: Partial<CreateVehicleInput>) => {
      try {
        const setClauses = Object.entries(updates)
          .map(([key, value]) => {
            if (value === undefined) return null;
            const column = key === 'availability_status' ? 'status' : key;
            if (value === null) return `${column}=NULL`;
            if (typeof value === 'number') return `${column}=${value}`;
            return `${column}='${escapeSqlValue(String(value))}'`;
          })
          .filter(Boolean)
          .join(', ');

        if (!setClauses) return null;

        await azureApi.post('/db/query', {
          query: `UPDATE fri_vehicles SET ${setClauses} WHERE id='${escapeSqlValue(id)}'`,
        });

        await fetch();
        return null;
      } catch (err) {
        console.error('Error updating vehicle:', err);
        throw err;
      }
    },
    []
  );

  // Delete vehicle
  const deleteVehicle = useCallback(async (id: string) => {
    try {
      await azureApi.post('/db/query', {
        query: `DELETE FROM fri_vehicles WHERE id='${escapeSqlValue(id)}'`,
      });

      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      throw err;
    }
  }, []);

  // Update availability status
  const updateStatus = useCallback(
    async (
      id: string,
      status: 'available' | 'rented' | 'maintenance' | 'retired'
    ) => {
      return updateVehicle(id, { availability_status: status } as any);
    },
    [updateVehicle]
  );

  return {
    vehicles,
    loading,
    error,
    refetch: fetch,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    updateStatus,
  };
}
