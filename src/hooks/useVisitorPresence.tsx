import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/azure/client';

// Local type definition to avoid importing Supabase library
interface RealtimeChannel {
  on(event: string, options: unknown, callback: (payload: unknown) => void): this;
  subscribe(callback?: (status: string) => void | Promise<void>): Promise<string>;
  track(data: unknown): Promise<unknown>;
  presenceState(): Record<string, unknown[]>;
}

// Extend supabase type locally
interface SupabaseClient {
  channel(name: string, options?: any): RealtimeChannel;
  removeChannel(channel: RealtimeChannel): Promise<unknown>;
}

interface VisitorPresence {
  visitorId: string;
  page: string;
  enteredAt: string;
  userAgent?: string;
}

interface UseVisitorPresenceOptions {
  isAdmin?: boolean;
}

export const useVisitorPresence = (options: UseVisitorPresenceOptions = {}) => {
  const { isAdmin = false } = options;
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const [visitorCount, setVisitorCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Generate or retrieve visitor ID
    if (!isAdmin) {
      let visitorId = sessionStorage.getItem('lejio_visitor_id');
      if (!visitorId) {
        visitorId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('lejio_visitor_id', visitorId);
      }
      visitorIdRef.current = visitorId;
    }

    const channel = supabase.channel('website-presence', {
      config: {
        presence: {
          key: isAdmin ? `admin_${Date.now()}` : visitorIdRef.current || 'unknown',
        },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allVisitors: VisitorPresence[] = [];
        
        Object.keys(state).forEach((key) => {
          // Only count non-admin visitors
          if (!key.startsWith('admin_')) {
            const presences = state[key];
            presences.forEach((presence) => {
              allVisitors.push({
                visitorId: key,
                page: presence.page || '/',
                enteredAt: presence.enteredAt || new Date().toISOString(),
                userAgent: presence.userAgent,
              });
            });
          }
        });

        setVisitors(allVisitors);
        setVisitorCount(allVisitors.length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && !isAdmin) {
          // Track visitor presence with current page
          await channel.track({
            page: window.location.pathname,
            enteredAt: new Date().toISOString(),
            userAgent: navigator.userAgent.substring(0, 100),
          });
        }
      });

    channelRef.current = channel;

    // Update page when navigating (for non-admin visitors)
    const handleLocationChange = () => {
      if (!isAdmin && channelRef.current) {
        channelRef.current.track({
          page: window.location.pathname,
          enteredAt: sessionStorage.getItem('lejio_entered_at') || new Date().toISOString(),
          userAgent: navigator.userAgent.substring(0, 100),
        });
      }
    };

    // Store entry time
    if (!isAdmin && !sessionStorage.getItem('lejio_entered_at')) {
      sessionStorage.setItem('lejio_entered_at', new Date().toISOString());
    }

    // Listen for route changes
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [isAdmin]);

  // Function to update page (call this on route changes)
  const updatePage = (page: string) => {
    if (!isAdmin && channelRef.current) {
      channelRef.current.track({
        page,
        enteredAt: sessionStorage.getItem('lejio_entered_at') || new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 100),
      });
    }
  };

  return {
    visitors,
    visitorCount,
    updatePage,
  };
};
