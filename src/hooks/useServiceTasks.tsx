import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ServiceTask {
  id: string;
  vehicle_id: string;
  lessor_id: string;
  task_type: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  assigned_to: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  km_trigger: number | null;
  date_trigger: string | null;
  estimated_duration_minutes: number;
  location_id: string | null;
  notes: string | null;
  auto_block_bookings: boolean;
  booking_block_start: string | null;
  booking_block_end: string | null;
  completed_at: string | null;
  created_at: string;
  vehicle?: {
    make: string;
    model: string;
    registration_number: string;
    current_km: number;
  };
  location?: {
    name: string;
    city: string;
  };
}

export type CreateServiceTaskInput = Omit<ServiceTask, 'id' | 'lessor_id' | 'created_at' | 'vehicle' | 'location'>;

export const TASK_TYPES = [
  { value: 'service', label: 'Service', icon: '🔧' },
  { value: 'inspection', label: 'Syn', icon: '📋' },
  { value: 'tire_change', label: 'Dækskift', icon: '🛞' },
  { value: 'cleaning', label: 'Rengøring', icon: '🧹' },
  { value: 'repair', label: 'Reparation', icon: '🔨' },
  { value: 'transport', label: 'Transport', icon: '🚚' },
];

export const useServiceTasks = (vehicleId?: string) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ServiceTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('service_tasks')
        .select('*')
        .eq('lessor_id', user.id)
        .order('scheduled_date', { ascending: true });

      if (vehicleId) {
        query = query.eq('vehicle_id', vehicleId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks((data || []) as unknown as ServiceTask[]);
    } catch (err) {
      console.error('Error fetching service tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, vehicleId]);

  const createTask = async (input: CreateServiceTaskInput): Promise<ServiceTask | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('service_tasks')
        .insert({
          ...input,
          lessor_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Opgave oprettet');
      await fetchTasks();
      return data as unknown as ServiceTask;
    } catch (err) {
      console.error('Error creating task:', err);
      toast.error('Kunne ikke oprette opgave');
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<ServiceTask>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Opgave opdateret');
      return true;
    } catch (err) {
      console.error('Error updating task:', err);
      toast.error('Kunne ikke opdatere opgave');
      return false;
    }
  };

  const completeTask = async (id: string): Promise<boolean> => {
    return updateTask(id, { 
      status: 'completed', 
      completed_at: new Date().toISOString() 
    });
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('service_tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Opgave slettet');
      return true;
    } catch (err) {
      console.error('Error deleting task:', err);
      toast.error('Kunne ikke slette opgave');
      return false;
    }
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (!t.scheduled_date) return false;
      const taskDate = new Date(t.scheduled_date);
      return taskDate >= now && taskDate <= nextWeek;
    });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    return tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      if (!t.scheduled_date) return false;
      return new Date(t.scheduled_date) < now;
    });
  };

  const checkKmTriggers = async () => {
    // Placeholder for km trigger checking
    console.log('Checking km triggers...');
  };

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    isLoading,
    createTask,
    updateTask,
    completeTask,
    deleteTask,
    getUpcomingTasks,
    getOverdueTasks,
    checkKmTriggers,
    refetch: fetchTasks
  };
};
