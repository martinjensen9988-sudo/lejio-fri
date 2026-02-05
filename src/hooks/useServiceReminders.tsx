import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ServiceReminder {
  id: string;
  vehicle_id: string;
  service_type: string;
  due_date: string | null;
  due_km: number | null;
  current_km: number | null;
  is_completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

export const useServiceReminders = (vehicleId?: string) => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<ServiceReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReminders = useCallback(async () => {
    if (!user) {
      setReminders([]);
      setIsLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('service_reminders')
        .select(`
          *,
          vehicles:vehicle_id (
            owner_id
          )
        `)
        .eq('is_completed', false)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter to only show reminders for vehicles owned by the user
      const userReminders = data?.filter(r => r.vehicles?.owner_id === user.id) || [];
      setReminders(userReminders);
    } catch (error) {
      console.error('Error fetching service reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, vehicleId]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const addReminder = async (reminder: Omit<ServiceReminder, 'id' | 'is_completed' | 'completed_at'>) => {
    try {
      const { data, error } = await supabase
        .from('service_reminders')
        .insert(reminder)
        .select()
        .single();

      if (error) throw error;

      setReminders(prev => [...prev, data]);
      toast.success('Servicepåmindelse oprettet');
      return data;
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast.error('Kunne ikke oprette påmindelse');
      return null;
    }
  };

  const completeReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_reminders')
        .update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Service markeret som udført');
      return true;
    } catch (error) {
      console.error('Error completing reminder:', error);
      toast.error('Kunne ikke markere som udført');
      return false;
    }
  };

  const updateKm = async (id: string, currentKm: number) => {
    try {
      const { error } = await supabase
        .from('service_reminders')
        .update({ current_km: currentKm })
        .eq('id', id);

      if (error) throw error;

      setReminders(prev => prev.map(r => r.id === id ? { ...r, current_km: currentKm } : r));
      return true;
    } catch (error) {
      console.error('Error updating km:', error);
      return false;
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('service_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders(prev => prev.filter(r => r.id !== id));
      toast.success('Påmindelse slettet');
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast.error('Kunne ikke slette påmindelse');
      return false;
    }
  };

  // Get overdue reminders
  const getOverdueReminders = () => {
    const today = new Date();
    return reminders.filter(r => {
      if (r.due_date && new Date(r.due_date) < today) return true;
      if (r.due_km && r.current_km && r.current_km >= r.due_km) return true;
      return false;
    });
  };

  // Get upcoming reminders (next 30 days or within 1000 km)
  const getUpcomingReminders = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return reminders.filter(r => {
      if (r.due_date) {
        const dueDate = new Date(r.due_date);
        if (dueDate >= today && dueDate <= thirtyDaysLater) return true;
      }
      if (r.due_km && r.current_km) {
        const kmLeft = r.due_km - r.current_km;
        if (kmLeft > 0 && kmLeft <= 1000) return true;
      }
      return false;
    });
  };

  return {
    reminders,
    isLoading,
    addReminder,
    completeReminder,
    updateKm,
    deleteReminder,
    getOverdueReminders,
    getUpcomingReminders,
    refetch: fetchReminders,
  };
};
