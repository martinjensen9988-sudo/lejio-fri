import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  type: 'call' | 'meeting' | 'email' | 'task';
  deal_id?: string;
  lead_id?: string;
  calendar_provider?: 'google' | 'outlook' | 'ical';
  calendar_event_id?: string;
  created_at: string;
}

export const useCalendarIntegration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Connect to Google Calendar
  const connectGoogleCalendar = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // This would use OAuth2 flow with Google
      // For now, placeholder implementation
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      const redirectUri = `${window.location.origin}/calendar/callback`;

      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes);
      authUrl.searchParams.append('access_type', 'offline');

      window.location.href = authUrl.toString();

      setIsConnected(true);
      toast({
        title: 'Forbindelse etableret',
        description: 'Din Google Calendar er nu forbundet',
      });

      return true;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke forbinde til Google Calendar',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Connect to Outlook Calendar
  const connectOutlookCalendar = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const clientId = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
      const redirectUri = `${window.location.origin}/calendar/outlook-callback`;

      const scopes = [
        'https://graph.microsoft.com/Calendars.ReadWrite',
        'https://graph.microsoft.com/offline_access',
      ].join('%20');

      const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', scopes);

      window.location.href = authUrl.toString();

      setIsConnected(true);
      toast({
        title: 'Forbindelse etableret',
        description: 'Din Outlook Calendar er nu forbundet',
      });

      return true;
    } catch (error) {
      console.error('Error connecting to Outlook:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke forbinde til Outlook',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Create calendar event from deal/activity
  const createCalendarEvent = useCallback(async (
    event: Omit<CalendarEvent, 'id' | 'created_at' | 'calendar_event_id'>
  ): Promise<CalendarEvent | null> => {
    try {
      // This would sync with the connected calendar provider
      // Placeholder for actual API calls
      const newEvent: CalendarEvent = {
        id: Math.random().toString(),
        ...event,
        created_at: new Date().toISOString(),
      };

      toast({
        title: 'Begivenhed oprettet',
        description: `"${event.title}" er tilføjet til din kalender`,
      });

      return newEvent;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke oprette kalenderbegivenhed',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // Sync calendar event with deal follow-up
  const syncDealReminder = useCallback(async (
    dealId: string,
    reminderDate: Date,
    reminderType: 'call' | 'meeting' | 'email'
  ): Promise<boolean> => {
    try {
      const event: Omit<CalendarEvent, 'id' | 'created_at' | 'calendar_event_id'> = {
        title: `CRM: Deal opfølgning`,
        description: `Opfølgning på deal #${dealId}`,
        start_time: reminderDate.toISOString(),
        end_time: new Date(reminderDate.getTime() + 30 * 60000).toISOString(), // 30 min duration
        type: reminderType,
        deal_id: dealId,
      };

      await createCalendarEvent(event);
      return true;
    } catch (error) {
      console.error('Error syncing deal reminder:', error);
      return false;
    }
  }, [createCalendarEvent]);

  // Get available time slots
  const getAvailableTimeSlots = useCallback(async (
    date: Date,
    duration: number = 30 // minutes
  ): Promise<Date[]> => {
    try {
      // This would fetch busy times from calendar and return available slots
      // Placeholder implementation
      const slots: Date[] = [];
      const startHour = 9;
      const endHour = 18;

      for (let hour = startHour; hour < endHour; hour++) {
        const slotTime = new Date(date);
        slotTime.setHours(hour, 0, 0, 0);
        
        // In real implementation, check against calendar busy times
        slots.push(slotTime);
      }

      return slots;
    } catch (error) {
      console.error('Error getting available slots:', error);
      return [];
    }
  }, []);

  return {
    isLoading,
    isConnected,
    connectGoogleCalendar,
    connectOutlookCalendar,
    createCalendarEvent,
    syncDealReminder,
    getAvailableTimeSlots,
  };
};
