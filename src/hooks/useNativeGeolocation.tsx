import { useState, useCallback, useEffect } from 'react';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

interface UseNativeGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

interface UseNativeGeolocationReturn {
  position: Position | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: PermissionStatus | null;
  getCurrentPosition: () => Promise<Position | null>;
  requestPermissions: () => Promise<boolean>;
  isNative: boolean;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

export const useNativeGeolocation = (
  options: UseNativeGeolocationOptions = {}
): UseNativeGeolocationReturn => {
  const [position, setPosition] = useState<Position | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
    watchPosition = false,
  } = options;

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        setPermissionStatus(status);
      } catch (err) {
        console.error('Error checking geolocation permissions:', err);
      }
    };
    checkPermissions();
  }, []);

  // Watch position if enabled
  useEffect(() => {
    if (!watchPosition) return;

    let watchId: string | undefined;

    const startWatching = async () => {
      try {
        const status = await Geolocation.checkPermissions();
        if (status.location !== 'granted') return;

        watchId = await Geolocation.watchPosition(
          { enableHighAccuracy, timeout, maximumAge },
          (pos, err) => {
            if (err) {
              setError(err.message);
            } else if (pos) {
              setPosition(pos);
              setError(null);
            }
          }
        );
      } catch (err) {
        console.error('Error watching position:', err);
      }
    };

    startWatching();

    return () => {
      if (watchId) {
        Geolocation.clearWatch({ id: watchId });
      }
    };
  }, [watchPosition, enableHighAccuracy, timeout, maximumAge]);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const status = await Geolocation.requestPermissions();
      setPermissionStatus(status);
      return status.location === 'granted';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke anmode om tilladelser';
      setError(message);
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<Position | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check permissions first
      const status = await Geolocation.checkPermissions();
      
      if (status.location !== 'granted') {
        const requested = await Geolocation.requestPermissions();
        setPermissionStatus(requested);
        
        if (requested.location !== 'granted') {
          throw new Error('Lokationstilladelse blev nægtet');
        }
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy,
        timeout,
        maximumAge,
      });

      setPosition(pos);
      return pos;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke hente lokation';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableHighAccuracy, timeout, maximumAge]);

  // Haversine formula to calculate distance between two points
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371; // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c; // Distance in km
    },
    []
  );

  return {
    position,
    isLoading,
    error,
    permissionStatus,
    getCurrentPosition,
    requestPermissions,
    isNative,
    calculateDistance,
  };
};

// Helper to format coordinates for display
export const formatCoordinates = (position: Position): string => {
  const lat = position.coords.latitude.toFixed(6);
  const lon = position.coords.longitude.toFixed(6);
  return `${lat}, ${lon}`;
};

// Helper to check if position is within a radius (in km)
export const isWithinRadius = (
  position: Position,
  targetLat: number,
  targetLon: number,
  radiusKm: number
): boolean => {
  const R = 6371;
  const dLat = ((targetLat - position.coords.latitude) * Math.PI) / 180;
  const dLon = ((targetLon - position.coords.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((position.coords.latitude * Math.PI) / 180) *
      Math.cos((targetLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance <= radiusKm;
};
