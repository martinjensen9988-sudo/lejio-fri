import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';

// Local type definitions to avoid importing Supabase library
interface RealtimeChannel {
  on(event: string, options: unknown, callback: (payload: unknown) => void): this;
  subscribe(callback?: (status: string) => void | Promise<void>): Promise<string>;
  track(data: unknown): Promise<unknown>;
  presenceState(): Record<string, unknown[]>;
}

interface PostgresChangesPayload<T = Record<string, unknown>> {
  schema: string;
  table: string;
  commit_timestamp: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
}

// Type-safe real-time subscription management
export interface RealtimeSubscriptionConfig {
  tableName: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onData: (payload: PostgresChangesPayload<Record<string, unknown>>) => void;
  onError?: (error: Error) => void;
}

export const useRealtimeSubscription = (config: RealtimeSubscriptionConfig) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const subscribeToChanges = () => {
      try {
        const newChannel = supabase
          .channel(`${config.tableName}:${config.event || '*'}`)
          .on(
            'postgres_changes',
            {
              event: config.event || '*',
              schema: 'public',
              table: config.tableName,
              ...(config.filter && { filter: config.filter }),
            } as Parameters<typeof supabase.channel['on']>[1],
            (payload) => {
              config.onData(payload as PostgresChangesPayload<Record<string, unknown>>);
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              setIsSubscribed(true);
            } else if (status === 'CLOSED') {
              setIsSubscribed(false);
            } else if (status === 'CHANNEL_ERROR') {
              config.onError?.(new Error('Real-time subscription error'));
              setIsSubscribed(false);
            }
          });

        setChannel(newChannel);
      } catch (error) {
        config.onError?.(error instanceof Error ? error : new Error('Subscription error'));
      }
    };
    subscribeToChanges();
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [config, channel]);

  return { isSubscribed };
};

// Real-time invoice updates hook
export const useRealtimeInvoices = (userId: string | undefined, onUpdate: (payload: PostgresChangesPayload<Record<string, unknown>>) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`invoices:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `lessor_id=eq.${userId}`,
        } as Parameters<typeof supabase.channel['on']>[1],
        (payload) => {
          onUpdate(payload as PostgresChangesPayload<Record<string, unknown>>);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);

  return { isConnected };
};

// Real-time payment reminders hook
export const useRealtimePaymentReminders = (onUpdate: (payload: PostgresChangesPayload<Record<string, unknown>>) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel('payment_reminders:all')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_reminders',
        } as Parameters<typeof supabase.channel['on']>[1],
        (payload) => {
          onUpdate(payload as PostgresChangesPayload<Record<string, unknown>>);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);

  return { isConnected };
};

// Real-time subscriptions hook
export const useRealtimeSubscriptions = (userId: string | undefined, onUpdate: (payload: PostgresChangesPayload<Record<string, unknown>>) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`subscriptions:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `renter_id=eq.${userId}`,
        } as Parameters<typeof supabase.channel['on']>[1],
        (payload) => {
          onUpdate(payload as PostgresChangesPayload<Record<string, unknown>>);
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onUpdate]);

  return { isConnected };
};
    //     setIsConnected(status === 'SUBSCRIBED');
    //   });
    // return () => {
    //   supabase.removeChannel(channel);
    // };
  }, [userId, onUpdate]);

  return { isConnected };
};

// Broadcast message hook for pub/sub communication
export const useBroadcast = (channelName: string, onMessage?: (data: unknown) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  const sendMessage = useCallback(
    (data: unknown) => {
      const channel = supabase.channel(channelName);
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: data,
      });
    },
    [channelName]
  );

  useEffect(() => {
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message' }, (payload) => {
        onMessage?.(payload.payload);
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, onMessage]);

  return { isConnected, sendMessage };
};
