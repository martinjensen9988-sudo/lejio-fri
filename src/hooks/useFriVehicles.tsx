import { useState, useEffect, useCallback } from 'react';
import { api as azureApi } from '@/integrations/api/client';

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
  is_active?: boolean;
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

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export function useFriVehicles(lessorId: string | null) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!lessorId) return;
    try {
      setLoading(true);
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT *, availability_status AS status FROM fri_vehicles WHERE lessor_id='${esc(lessorId)}' ORDER BY created_at DESC`,
      });
      setVehicles((normalizeRows(response) as Vehicle[]) || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const addVehicle = useCallback(async (input: CreateVehicleInput) => {
    if (!lessorId) throw new Error('No lessor ID');
    const vinVal = input.vin ? `'${esc(input.vin)}'` : 'NULL';
    const yearVal = input.year ?? 'NULL';
    const rateVal = input.daily_rate ?? 0;
    await azureApi.post('/db-query', {
      query: `INSERT INTO fri_vehicles (lessor_id, make, model, year, license_plate, vin, daily_rate, availability_status, is_active)
              VALUES ('${esc(lessorId)}', '${esc(input.make)}', '${esc(input.model)}', ${yearVal}, '${esc(input.license_plate)}', ${vinVal}, ${rateVal}, 'available', TRUE)`,
    });
    await fetchVehicles();
    return null;
  }, [lessorId, fetchVehicles]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<CreateVehicleInput & { availability_status: string }>) => {
    const setClauses = Object.entries(updates)
      .map(([key, value]) => {
        if (value === undefined) return null;
        const col = key === 'status' ? 'availability_status' : key;
        if (value === null) return `${col}=NULL`;
        if (typeof value === 'number') return `${col}=${value}`;
        return `${col}='${esc(String(value))}'`;
      })
      .filter(Boolean)
      .join(', ');
    if (!setClauses) return null;
    await azureApi.post('/db-query', {
      query: `UPDATE fri_vehicles SET ${setClauses}, updated_at=NOW() WHERE id='${esc(id)}'`,
    });
    await fetchVehicles();
    return null;
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    await azureApi.post('/db-query', {
      query: `DELETE FROM fri_vehicles WHERE id='${esc(id)}'`,
    });
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const updateStatus = useCallback(async (id: string, status: string) => {
    return updateVehicle(id, { availability_status: status } as any);
  }, [updateVehicle]);

  return { vehicles, loading, error, refetch: fetchVehicles, addVehicle, updateVehicle, deleteVehicle, updateStatus };
}
