import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { differenceInDays, parseISO, addYears } from 'date-fns';

export interface InspectionReminder {
  id: string;
  vehicle_id: string;
  inspection_type: 'standard' | 'first_registration' | 'trailer' | 'caravan';
  due_date: string;
  last_inspection_date: string | null;
  reminder_sent_at: string | null;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useInspectionReminders = (vehicleId?: string) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<InspectionReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('inspection_reminders')
        .select('*')
        .eq('is_completed', false)
        .order('due_date', { ascending: true });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReminders((data || []).map(r => ({
        ...r,
        inspection_type: r.inspection_type as InspectionReminder['inspection_type']
      })));
    } catch (error) {
      console.error('Error fetching inspection reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, vehicleId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (reminder: Omit<InspectionReminder, 'id' | 'created_at' | 'updated_at' | 'is_completed' | 'completed_at' | 'reminder_sent_at'>): Promise<InspectionReminder | null> => {
    try {
      const { data, error } = await supabase
        .from('inspection_reminders')
        .insert({
          ...reminder,
          is_completed: false,
        })
        .select()
        .single();

      if (error) throw error;

      const typedData = { ...data, inspection_type: data.inspection_type as InspectionReminder['inspection_type'] };
      setReminders(prev => [...prev, typedData].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
      toast.success('Synspåmindelse tilføjet');
      return typedData;
    } catch (error) {
      console.error('Error adding inspection reminder:', error);
      toast.error('Kunne ikke tilføje synspåmindelse');
      return null;
    }
  };

  const completeInspection = async (id: string, newDueDate?: string): Promise<boolean> => {
    try {
      const reminder = reminders.find(r => r.id === id);
      if (!reminder) return false;

      // Mark current as completed
      const { error: updateError } = await supabase
        .from('inspection_reminders')
        .update({
          is_completed: true,
          completed_at: new Date().toISOString(),
          last_inspection_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create new reminder for next inspection
      const nextDueDate = newDueDate || addYears(new Date(), reminder.inspection_type === 'first_registration' ? 4 : 2).toISOString().split('T')[0];
      
      await supabase
        .from('inspection_reminders')
        .insert({
          vehicle_id: reminder.vehicle_id,
          inspection_type: 'standard', // After first inspection, it's always standard
          due_date: nextDueDate,
          last_inspection_date: new Date().toISOString().split('T')[0],
        });

      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Syn markeret som gennemført');
      return true;
    } catch (error) {
      console.error('Error completing inspection:', error);
      toast.error('Kunne ikke opdatere syn');
      return false;
    }
  };

  const deleteReminder = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('inspection_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Synspåmindelse slettet');
      return true;
    } catch (error) {
      console.error('Error deleting inspection reminder:', error);
      toast.error('Kunne ikke slette synspåmindelse');
      return false;
    }
  };

  const getOverdueReminders = (): InspectionReminder[] => {
    return reminders.filter(r => {
      const daysUntilDue = differenceInDays(parseISO(r.due_date), new Date());
      return daysUntilDue < 0;
    });
  };

  const getUpcomingReminders = (days: number = 60): InspectionReminder[] => {
    return reminders.filter(r => {
      const daysUntilDue = differenceInDays(parseISO(r.due_date), new Date());
      return daysUntilDue >= 0 && daysUntilDue <= days;
    });
  };

  const calculateNextInspectionDate = (
    firstRegistrationDate: string,
    vehicleType: string
  ): string => {
    const regDate = parseISO(firstRegistrationDate);
    const now = new Date();
    const vehicleAge = differenceInDays(now, regDate) / 365;

    // Danish inspection rules:
    // Cars: First after 4 years, then every 2 years
    // Trailers under 3500kg: No regular inspection unless for commercial use
    // Caravans: Same as cars
    
    if (vehicleType === 'trailer') {
      // Trailers under 3500kg typically don't need regular inspection
      return addYears(now, 10).toISOString().split('T')[0];
    }

    if (vehicleAge < 4) {
      return addYears(regDate, 4).toISOString().split('T')[0];
    } else {
      // Every 2 years after first inspection
      const yearsSinceFirst = Math.floor((vehicleAge - 4) / 2);
      return addYears(regDate, 4 + (yearsSinceFirst + 1) * 2).toISOString().split('T')[0];
    }
  };

  return {
    reminders,
    isLoading,
    addReminder,
    completeInspection,
    deleteReminder,
    getOverdueReminders,
    getUpcomingReminders,
    calculateNextInspectionDate,
    refetch: fetchReminders,
  };
};
