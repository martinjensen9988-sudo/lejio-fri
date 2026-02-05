import { useState } from 'react';
import { supabase } from '@/integrations/azure/client';

export interface VehicleData {
  registration: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  fuel_type: string;
  color: string;
  vin: string;
  vehicle_id: string;
}

interface UseVehicleLookupReturn {
  vehicle: VehicleData | null;
  isLoading: boolean;
  error: string | null;
  lookupVehicle: (registration: string) => Promise<VehicleData | null>;
  reset: () => void;
}

export const useVehicleLookup = (): UseVehicleLookupReturn => {
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupVehicle = async (registration: string): Promise<VehicleData | null> => {
    if (!registration || registration.trim().length < 2) {
      setError('Indtast venligst en gyldig nummerplade');
      return null;
    }

    setIsLoading(true);
    setError(null);
    setVehicle(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('vehicle-lookup', {
        body: { registration: registration.trim() },
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Kunne ikke hente bildata. Prøv igen.');
        return null;
      }

      if (data.error) {
        if (data.code === 'NOT_FOUND') {
          setError('Køretøj ikke fundet. Tjek nummerpladen.');
        } else {
          setError(data.error);
        }
        return null;
      }

      setVehicle(data.vehicle);
      return data.vehicle;
    } catch (err) {
      console.error('Lookup error:', err);
      setError('Der opstod en fejl. Prøv igen senere.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setVehicle(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    vehicle,
    isLoading,
    error,
    lookupVehicle,
    reset,
  };
};
