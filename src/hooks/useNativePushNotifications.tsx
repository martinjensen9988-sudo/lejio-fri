import { useState, useEffect, useCallback } from 'react';
import { 
  PushNotifications, 
  Token, 
  PushNotificationSchema, 
  ActionPerformed 
} from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UseNativePushNotificationsReturn {
  isSupported: boolean;
  isRegistered: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
  register: () => Promise<boolean>;
  unregister: () => Promise<boolean>;
}

export const useNativePushNotifications = (): UseNativePushNotificationsReturn => {
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const isSupported = Capacitor.isNativePlatform();

  // Set up listeners on mount
  useEffect(() => {
    if (!isSupported) return;

    // Handle registration success
    const registrationListener = PushNotifications.addListener(
      'registration',
      async (token: Token) => {
        console.log('Push registration success, token:', token.value);
        setToken(token.value);
        setIsRegistered(true);
        
        // Save token to database
        if (user) {
          await saveTokenToDatabase(token.value);
        }
      }
    );

    // Handle registration error
    const registrationErrorListener = PushNotifications.addListener(
      'registrationError',
      (err) => {
        console.error('Push registration error:', err);
        setError('Kunne ikke registrere push-notifikationer');
        setIsRegistered(false);
      }
    );

    // Handle incoming notifications while app is open
    const notificationReceivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        
        // Show toast for foreground notifications
        toast(notification.title || 'Ny notifikation', {
          description: notification.body,
        });
      }
    );

    // Handle notification tap/action
    const notificationActionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (notification: ActionPerformed) => {
        console.log('Push notification action performed:', notification);
        
        // Handle deep linking based on notification data
        const data = notification.notification.data;
        if (data?.route) {
          window.location.href = data.route;
        }
      }
    );

    // Check if already registered
    checkRegistrationStatus();

    return () => {
      registrationListener.then(l => l.remove());
      registrationErrorListener.then(l => l.remove());
      notificationReceivedListener.then(l => l.remove());
      notificationActionListener.then(l => l.remove());
    };
  }, [isSupported, user]);

  const checkRegistrationStatus = async () => {
    if (!isSupported) return;

    try {
      const result = await PushNotifications.checkPermissions();
      setIsRegistered(result.receive === 'granted');
    } catch (err) {
      console.error('Error checking push permission status:', err);
    }
  };

  const saveTokenToDatabase = async (fcmToken: string) => {
    if (!user) return;

    try {
      // Upsert the push subscription with FCM token
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: `fcm:${fcmToken}`, // Use fcm: prefix to identify native tokens
          p256dh: 'native', // Placeholder for native push
          auth: 'native',
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving push token:', error);
      }
    } catch (err) {
      console.error('Error saving push token to database:', err);
    }
  };

  const removeTokenFromDatabase = async () => {
    if (!user || !token) return;

    try {
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', `fcm:${token}`);
    } catch (err) {
      console.error('Error removing push token from database:', err);
    }
  };

  const register = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Push-notifikationer understøttes ikke på denne enhed');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        // Request permission
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setError('Push-notifikationer blev nægtet');
        setIsLoading(false);
        return false;
      }

      // Register with FCM/APNs
      await PushNotifications.register();
      
      toast.success('Push-notifikationer aktiveret!');
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke aktivere push-notifikationer';
      setError(message);
      toast.error(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const unregister = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    setIsLoading(true);
    setError(null);

    try {
      // Remove from database first
      await removeTokenFromDatabase();

      // Note: There's no official unregister method in Capacitor Push Notifications
      // The token will become invalid when the app is uninstalled
      // For now, we just remove from our database
      
      setIsRegistered(false);
      setToken(null);
      toast.success('Push-notifikationer deaktiveret');
      setIsLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kunne ikke deaktivere push-notifikationer';
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, token, user]);

  return {
    isSupported,
    isRegistered,
    isLoading,
    error,
    token,
    register,
    unregister,
  };
};

// Helper to create notification channel for Android
export const createNotificationChannel = async () => {
  if (Capacitor.getPlatform() !== 'android') return;

  try {
    // Note: This requires @capacitor/local-notifications for channel creation
    // For FCM push notifications, channels are typically created in Android native code
    console.log('Android notification channel should be created in native code');
  } catch (err) {
    console.error('Error creating notification channel:', err);
  }
};
