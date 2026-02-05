import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface UseNativeCameraOptions {
  quality?: number;
  allowEditing?: boolean;
  resultType?: CameraResultType;
}

interface UseNativeCameraReturn {
  photo: Photo | null;
  isLoading: boolean;
  error: string | null;
  takePhoto: () => Promise<Photo | null>;
  pickFromGallery: () => Promise<Photo | null>;
  clearPhoto: () => void;
  isNative: boolean;
}

export const useNativeCamera = (options: UseNativeCameraOptions = {}): UseNativeCameraReturn => {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const {
    quality = 90,
    allowEditing = false,
    resultType = CameraResultType.DataUrl,
  } = options;

  const takePhoto = useCallback(async (): Promise<Photo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Check and request permissions
      const permissions = await Camera.checkPermissions();
      
      if (permissions.camera !== 'granted') {
        const requested = await Camera.requestPermissions({ permissions: ['camera'] });
        if (requested.camera !== 'granted') {
          throw new Error('Kamera-tilladelse blev nægtet');
        }
      }

      const image = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType,
        source: CameraSource.Camera,
        promptLabelHeader: 'Tag billede',
        promptLabelCancel: 'Annuller',
        promptLabelPhoto: 'Fra galleri',
        promptLabelPicture: 'Tag billede',
      });

      setPhoto(image);
      return image;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke tage billede';
      // Don't set error for user cancellation
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        setError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [quality, allowEditing, resultType]);

  const pickFromGallery = useCallback(async (): Promise<Photo | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const permissions = await Camera.checkPermissions();
      
      if (permissions.photos !== 'granted') {
        const requested = await Camera.requestPermissions({ permissions: ['photos'] });
        if (requested.photos !== 'granted') {
          throw new Error('Galleri-tilladelse blev nægtet');
        }
      }

      const image = await Camera.getPhoto({
        quality,
        allowEditing,
        resultType,
        source: CameraSource.Photos,
      });

      setPhoto(image);
      return image;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke vælge billede';
      if (!message.includes('cancelled') && !message.includes('canceled')) {
        setError(message);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [quality, allowEditing, resultType]);

  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    photo,
    isLoading,
    error,
    takePhoto,
    pickFromGallery,
    clearPhoto,
    isNative,
  };
};

// Helper function to convert Photo to File for upload
export const photoToFile = async (photo: Photo, fileName: string = 'photo.jpg'): Promise<File | null> => {
  if (!photo.dataUrl) return null;

  try {
    const response = await fetch(photo.dataUrl);
    const blob = await response.blob();
    return new File([blob], fileName, { type: 'image/jpeg' });
  } catch {
    return null;
  }
};

// Helper to get the best available image source (dataUrl or webPath)
export const getPhotoSource = (photo: Photo): string | undefined => {
  return photo.dataUrl || photo.webPath;
};
