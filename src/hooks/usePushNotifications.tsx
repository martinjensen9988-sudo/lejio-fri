import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  permission: NotificationPermission | 'default';
  vapidPublicKey: string | null;
}

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    permission: 'default',
    vapidPublicKey: null,
  });

  // Fetch VAPID public key and check support
  useEffect(() => {
    const init = async () => {
      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      const permission = 'Notification' in window ? Notification.permission : 'default';
      
      let vapidPublicKey: string | null = null;
      
      if (isSupported) {
        try {
          const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
          if (!error && data?.publicKey) {
            vapidPublicKey = data.publicKey;
          }
        } catch (err) {
          console.error('Failed to fetch VAPID public key:', err);
        }
      }
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission,
        vapidPublicKey,
        isLoading: isSupported && !!user,
      }));
    };
    
    init();
  }, [user]);

  // Check subscription status and update permission
  useEffect(() => {
    const checkSubscription = async () => {
      if (!state.isSupported || !user) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        // Re-check permission status (it may have changed)
        const currentPermission = 'Notification' in window ? Notification.permission : 'default';
        
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        setState(prev => ({
          ...prev,
          isSubscribed: !!subscription,
          permission: currentPermission,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Error checking push subscription:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkSubscription();

    // Listen for permission changes (if browser supports it)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName }).then(permissionStatus => {
        permissionStatus.onchange = () => {
          setState(prev => ({ 
            ...prev, 
            permission: Notification.permission 
          }));
        };
      }).catch(() => {
        // Some browsers don't support querying notification permission
      });
    }
  }, [state.isSupported, user]);

  const subscribe = useCallback(async () => {
    if (!state.isSupported || !user) {
      toast.error('Push notifikationer understøttes ikke i denne browser');
      return false;
    }

    if (!state.vapidPublicKey) {
      toast.error('Push notifikationer er ikke konfigureret');
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(prev => ({ ...prev, permission }));

      if (permission !== 'granted') {
        toast.error('Du skal give tilladelse til notifikationer');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(state.vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();

      // Save subscription to database
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionJson.endpoint!,
          p256dh: subscriptionJson.keys!.p256dh,
          auth: subscriptionJson.keys!.auth,
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (error) {
        console.error('Error saving subscription:', error);
        toast.error('Kunne ikke gemme notifikationsindstillinger');
        setState(prev => ({ ...prev, isLoading: false }));
        return false;
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      toast.success('Push notifikationer aktiveret!');
      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast.error('Kunne ikke aktivere push notifikationer');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [state.isSupported, state.vapidPublicKey, user]);

  const unsubscribe = useCallback(async () => {
    if (!user) return false;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Remove from database
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', subscription.endpoint);
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      toast.success('Push notifikationer deaktiveret');
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Kunne ikke deaktivere push notifikationer');
      setState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  }, [user]);

  return {
    ...state,
    subscribe,
    unsubscribe,
  };
};
