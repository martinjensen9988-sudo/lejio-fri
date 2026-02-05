import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useToast } from '@/hooks/use-toast';
import { SalesLead } from './useSalesLeads';

// Pipeline stages configuration
export const CRM_STAGES = [
  { id: 'new', label: 'Ny', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Kvalificeret', color: 'bg-purple-500' },
  { id: 'proposal', label: 'Tilbud sendt', color: 'bg-yellow-500' },
  { id: 'negotiation', label: 'Forhandling', color: 'bg-orange-500' },
  { id: 'won', label: 'Vundet', color: 'bg-green-500' },
  { id: 'lost', label: 'Tabt', color: 'bg-red-500' },
] as const;

export const ACTIVITY_TYPES = [
  { id: 'call', label: 'Opkald', icon: 'Phone' },
  { id: 'email', label: 'Email', icon: 'Mail' },
  { id: 'meeting', label: 'Møde', icon: 'Calendar' },
  { id: 'note', label: 'Note', icon: 'FileText' },
  { id: 'demo', label: 'Demo', icon: 'Monitor' },
] as const;

export const TASK_PRIORITIES = [
  { id: 'low', label: 'Lav', color: 'text-gray-500' },
  { id: 'medium', label: 'Medium', color: 'text-yellow-500' },
  { id: 'high', label: 'Høj', color: 'text-orange-500' },
  { id: 'urgent', label: 'Akut', color: 'text-red-500' },
] as const;

export interface CRMDeal {
  id: string;
  lead_id?: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  expected_close_date?: string;
  actual_close_date?: string;
  won_lost_reason?: string;
  assigned_to?: string;
  company_name?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  source: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Joined data
  lead?: SalesLead;
}

export interface CRMActivity {
  id: string;
  deal_id?: string;
  lead_id?: string;
  activity_type: string;
  subject: string;
  description?: string;
  outcome?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  created_at: string;
  created_by?: string;
}

export interface CRMTask {
  id: string;
  deal_id?: string;
  lead_id?: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: string;
  status: string;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const useCRM = () => {
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // ========== DEALS ==========
  const fetchDeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .select('*, lead:sales_leads(*)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDeals((data as unknown as CRMDeal[]) || []);
    } catch (error) {
      console.error('Error fetching deals:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente deals',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const addDeal = useCallback(async (deal: Partial<CRMDeal>) => {
    try {
      if (!deal.title) {
        throw new Error('Titel er påkrævet');
      }

      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        title: deal.title,
        description: deal.description || null,
        value: deal.value || 0,
        currency: deal.currency || 'DKK',
        stage: deal.stage || 'new',
        probability: deal.probability || 0,
        expected_close_date: deal.expected_close_date || null,
        lead_id: deal.lead_id || null,
        company_name: deal.company_name || null,
        contact_name: deal.contact_name || null,
        contact_email: deal.contact_email || null,
        contact_phone: deal.contact_phone || null,
        source: deal.source || 'manual',
        assigned_to: deal.assigned_to || null,
        created_by: userData.user?.id || null,
      };

      const { data, error } = await supabase
        .from('crm_deals')
        .insert(insertData)
        .select('*, lead:sales_leads(*)')
        .single();

      if (error) throw error;

      const newDealData = data as unknown as CRMDeal;
      setDeals((prev) => [newDealData, ...prev]);
      
      // Auto-create follow-up task for new deals
      const followUpDate = new Date();
      followUpDate.setDate(followUpDate.getDate() + 1); // Tomorrow
      
      await supabase.from('crm_tasks').insert({
        deal_id: newDealData.id,
        title: `Opfølgning: ${deal.title}`,
        description: 'Automatisk oprettet opgave - kontakt kunden',
        priority: 'medium',
        status: 'pending',
        due_date: followUpDate.toISOString(),
        created_by: userData.user?.id || null,
      });
      
      toast({
        title: 'Deal oprettet',
        description: `${deal.title} er tilføjet med opfølgningsopgave`,
      });

      return newDealData;
    } catch (error: unknown) {
      console.error('Error adding deal:', error);
      toast({
        title: 'Fejl',
        description: error?.message || 'Kunne ikke oprette deal',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateDeal = useCallback(async (id: string, updates: Partial<CRMDeal>) => {
    try {
      const { data, error } = await supabase
        .from('crm_deals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, lead:sales_leads(*)')
        .single();

      if (error) throw error;

      setDeals((prev) => prev.map((d) => (d.id === id ? (data as unknown as CRMDeal) : d)));
      toast({
        title: 'Deal opdateret',
        description: 'Ændringerne er gemt',
      });

      return data as unknown as CRMDeal;
    } catch (error) {
      console.error('Error updating deal:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere deal',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateDealStage = useCallback(async (id: string, stage: string) => {
    try {
      const updates: Partial<CRMDeal> = { 
        stage,
        updated_at: new Date().toISOString()
      };
      
      // Set probability based on stage
      const stageProbabilities: Record<string, number> = {
        new: 10,
        qualified: 25,
        proposal: 50,
        negotiation: 75,
        won: 100,
        lost: 0,
      };
      updates.probability = stageProbabilities[stage] || 0;

      // If won or lost, set actual close date
      if (stage === 'won' || stage === 'lost') {
        updates.actual_close_date = new Date().toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('crm_deals')
        .update(updates)
        .eq('id', id)
        .select('*, lead:sales_leads(*)')
        .single();

      if (error) throw error;

      setDeals((prev) => prev.map((d) => (d.id === id ? (data as unknown as CRMDeal) : d)));
      
      return data as unknown as CRMDeal;
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke flytte deal',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteDeal = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('crm_deals').delete().eq('id', id);
      if (error) throw error;

      setDeals((prev) => prev.filter((d) => d.id !== id));
      toast({
        title: 'Deal slettet',
        description: 'Deal er blevet fjernet',
      });
      return true;
    } catch (error) {
      console.error('Error deleting deal:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette deal',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Convert lead to deal
  const convertLeadToDeal = useCallback(async (lead: SalesLead, dealData?: Partial<CRMDeal>) => {
    const deal = await addDeal({
      title: `Deal: ${lead.company_name}`,
      lead_id: lead.id,
      company_name: lead.company_name,
      contact_name: lead.contact_name,
      contact_email: lead.contact_email,
      contact_phone: lead.contact_phone,
      source: lead.source,
      stage: 'qualified',
      ...dealData,
    });
    
    return deal;
  }, [addDeal]);

  // ========== ACTIVITIES ==========
  const fetchActivities = useCallback(async (dealId?: string, leadId?: string) => {
    try {
      let query = supabase
        .from('crm_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (dealId) {
        query = query.eq('deal_id', dealId);
      }
      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setActivities((data as CRMActivity[]) || []);
      return data as CRMActivity[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }, []);

  const addActivity = useCallback(async (activity: Partial<CRMActivity>) => {
    try {
      if (!activity.activity_type || !activity.subject) {
        throw new Error('Aktivitetstype og emne er påkrævet');
      }

      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        deal_id: activity.deal_id || null,
        lead_id: activity.lead_id || null,
        activity_type: activity.activity_type,
        subject: activity.subject,
        description: activity.description || null,
        outcome: activity.outcome || null,
        scheduled_at: activity.scheduled_at || null,
        completed_at: activity.completed_at || new Date().toISOString(),
        duration_minutes: activity.duration_minutes || null,
        created_by: userData.user?.id || null,
      };

      const { data, error } = await supabase
        .from('crm_activities')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setActivities((prev) => [data as CRMActivity, ...prev]);
      toast({
        title: 'Aktivitet registreret',
        description: activity.subject,
      });

      return data as CRMActivity;
    } catch (error: unknown) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Fejl',
        description: error?.message || 'Kunne ikke registrere aktivitet',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  // ========== TASKS ==========
  const fetchTasks = useCallback(async (filters?: { status?: string; dealId?: string }) => {
    try {
      let query = supabase
        .from('crm_tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dealId) {
        query = query.eq('deal_id', filters.dealId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setTasks((data as CRMTask[]) || []);
      return data as CRMTask[];
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }, []);

  const addTask = useCallback(async (task: Partial<CRMTask>) => {
    try {
      if (!task.title) {
        throw new Error('Titel er påkrævet');
      }

      const { data: userData } = await supabase.auth.getUser();

      const insertData = {
        deal_id: task.deal_id || null,
        lead_id: task.lead_id || null,
        title: task.title,
        description: task.description || null,
        due_date: task.due_date || null,
        priority: task.priority || 'medium',
        status: task.status || 'pending',
        assigned_to: task.assigned_to || null,
        created_by: userData.user?.id || null,
      };

      const { data, error } = await supabase
        .from('crm_tasks')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => [...prev, data as CRMTask].sort((a, b) => 
        new Date(a.due_date || 0).getTime() - new Date(b.due_date || 0).getTime()
      ));
      toast({
        title: 'Opgave oprettet',
        description: task.title,
      });

      return data as CRMTask;
    } catch (error: unknown) {
      console.error('Error adding task:', error);
      toast({
        title: 'Fejl',
        description: error?.message || 'Kunne ikke oprette opgave',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateTask = useCallback(async (id: string, updates: Partial<CRMTask>) => {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // If completing task, set completed_at
      if (updates.status === 'completed' && !updates.completed_at) {
        updateData.completed_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('crm_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => prev.map((t) => (t.id === id ? (data as CRMTask) : t)));
      toast({
        title: 'Opgave opdateret',
        description: 'Ændringerne er gemt',
      });

      return data as CRMTask;
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke opdatere opgave',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('crm_tasks').delete().eq('id', id);
      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast({
        title: 'Opgave slettet',
        description: 'Opgaven er blevet fjernet',
      });
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke slette opgave',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // ========== STATS ==========
  const getStats = useCallback(() => {
    const totalValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const weightedValue = deals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);
    const openDeals = deals.filter(d => !['won', 'lost'].includes(d.stage)).length;
    const wonDeals = deals.filter(d => d.stage === 'won').length;
    const lostDeals = deals.filter(d => d.stage === 'lost').length;
    const winRate = wonDeals + lostDeals > 0 ? (wonDeals / (wonDeals + lostDeals)) * 100 : 0;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const overdueTasks = tasks.filter(t => 
      t.status === 'pending' && t.due_date && new Date(t.due_date) < new Date()
    ).length;

    return {
      totalValue,
      weightedValue,
      openDeals,
      wonDeals,
      lostDeals,
      winRate,
      pendingTasks,
      overdueTasks,
      dealsByStage: CRM_STAGES.map(stage => ({
        stage: stage.id,
        label: stage.label,
        count: deals.filter(d => d.stage === stage.id).length,
        value: deals.filter(d => d.stage === stage.id).reduce((sum, d) => sum + (d.value || 0), 0),
      })),
    };
  }, [deals, tasks]);

  return {
    // Data
    deals,
    activities,
    tasks,
    isLoading,
    // Deals
    fetchDeals,
    addDeal,
    updateDeal,
    updateDealStage,
    deleteDeal,
    convertLeadToDeal,
    // Activities
    fetchActivities,
    addActivity,
    // Tasks
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    // Stats
    getStats,
  };
};
