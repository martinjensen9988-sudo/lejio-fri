import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/azure/client';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

interface Subscription {
  id: string;
  renter_id: string;
  lessor_id: string;
  vehicle_id: string;
  subscription_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  billing_cycle_days: number;
  start_date: string;
  end_date?: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  daily_rate: number;
  billing_amount: number;
  total_billing_cycles?: number;
  completed_billing_cycles: number;
  next_billing_date: string;
  auto_renew: boolean;
  payment_method?: string;
  stripe_subscription_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CreateSubscriptionData {
  vehicle_id: string;
  renter_id: string;
  subscription_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  daily_rate: number;
  start_date: string;
  end_date?: string;
  total_billing_cycles?: number;
  auto_renew?: boolean;
  payment_method?: string;
}

export const useSubscriptionBilling = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getBillingCycleDays = (type: string): number => {
    const cycleDays: Record<string, number> = {
      daily: 1,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };
    return cycleDays[type] || 30;
  };

  const calculateBillingAmount = (
    dailyRate: number,
    billingCycleDays: number
  ): number => {
    return dailyRate * billingCycleDays;
  };

  // Fetch subscriptions for a lessor
  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await (supabase)
        .from('subscriptions')
        .select('*')
        .eq('lessor_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data as Subscription[]) || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke hente abonnementer',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, toast]);

  // Create subscription
  const createSubscription = useCallback(
    async (subData: CreateSubscriptionData): Promise<Subscription | null> => {
      if (!user) return null;

      try {
        const billingCycleDays = getBillingCycleDays(subData.subscription_type);
        const billingAmount = calculateBillingAmount(
          subData.daily_rate,
          billingCycleDays
        );
        const nextBillingDate = addDays(
          new Date(subData.start_date),
          billingCycleDays
        )
          .toISOString()
          .split('T')[0];

        const { data, error } = await (supabase)
          .from('subscriptions')
          .insert({
            ...subData,
            lessor_id: user.id,
            billing_cycle_days: billingCycleDays,
            billing_amount: billingAmount,
            next_billing_date: nextBillingDate,
            completed_billing_cycles: 0,
            status: 'active',
          })
          .select()
          .single();

        if (error) throw error;

        const newSubscription = data as Subscription;
        setSubscriptions(prev => [newSubscription, ...prev]);

        toast({
          title: 'Abonnement oprettet',
          description: `Abonnement starter ${subData.start_date}`,
        });

        return newSubscription;
      } catch (error) {
        console.error('Error creating subscription:', error);
        toast({
          title: 'Fejl',
          description: 'Kunne ikke oprette abonnement',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user, toast]
  );

  // Process subscription billing (creates invoice for next cycle)
  const processBilling = useCallback(async (
    subscriptionId: string
  ): Promise<boolean> => {
    try {
      const { data: subscription, error: fetchError } = await (supabase)
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single();

      if (fetchError) throw fetchError;

      if (subscription.status !== 'active') {
        toast({
          title: 'Advarsel',
          description: 'Abonnement er ikke aktivt',
          variant: 'destructive',
        });
        return false;
      }

      // Create invoice for this billing cycle
      const billingCycleDays = subscription.billing_cycle_days;
      const nextBillingDate = addDays(
        new Date(subscription.next_billing_date),
        billingCycleDays
      )
        .toISOString()
        .split('T')[0];

      const { error: updateError } = await (supabase)
        .from('subscriptions')
        .update({
          next_billing_date: nextBillingDate,
          completed_billing_cycles: subscription.completed_billing_cycles + 1,
        })
        .eq('id', subscriptionId);

      if (updateError) throw updateError;

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? {
                ...sub,
                next_billing_date: nextBillingDate,
                completed_billing_cycles: sub.completed_billing_cycles + 1,
              }
            : sub
        )
      );

      toast({
        title: 'Faktura genereret',
        description: `Faktura for ${subscription.subscription_type} abonnement genereret`,
      });

      return true;
    } catch (error) {
      console.error('Error processing billing:', error);
      toast({
        title: 'Fejl',
        description: 'Kunne ikke generere faktura',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  // Pause subscription
  const pauseSubscription = useCallback(async (
    subscriptionId: string
  ): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('subscriptions')
        .update({ status: 'paused' })
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId ? { ...sub, status: 'paused' as const } : sub
        )
      );

      toast({
        title: 'Abonnement pauseret',
        description: 'Abonnement er nu pauseret',
      });

      return true;
    } catch (error) {
      console.error('Error pausing subscription:', error);
      return false;
    }
  }, [toast]);

  // Resume subscription
  const resumeSubscription = useCallback(async (
    subscriptionId: string
  ): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId ? { ...sub, status: 'active' as const } : sub
        )
      );

      toast({
        title: 'Abonnement genoptaget',
        description: 'Abonnement er nu aktivt igen',
      });

      return true;
    } catch (error) {
      console.error('Error resuming subscription:', error);
      return false;
    }
  }, [toast]);

  // Cancel subscription
  const cancelSubscription = useCallback(async (
    subscriptionId: string,
    cancelDate?: string
  ): Promise<boolean> => {
    try {
      const { error } = await (supabase)
        .from('subscriptions')
        .update({
          status: 'cancelled',
          end_date: cancelDate || new Date().toISOString().split('T')[0],
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? {
                ...sub,
                status: 'cancelled' as const,
                end_date: cancelDate || new Date().toISOString().split('T')[0],
              }
            : sub
        )
      );

      toast({
        title: 'Abonnement annulleret',
        description: 'Abonnement blev annulleret',
      });

      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }, [toast]);

  // Get upcoming billings
  const getUpcomingBillings = useCallback((): Subscription[] => {
    const today = new Date();
    return subscriptions.filter(
      sub =>
        sub.status === 'active' &&
        new Date(sub.next_billing_date) > today
    );
  }, [subscriptions]);

  return {
    subscriptions,
    isLoading,
    fetchSubscriptions,
    createSubscription,
    processBilling,
    pauseSubscription,
    resumeSubscription,
    cancelSubscription,
    getUpcomingBillings,
  };
};
