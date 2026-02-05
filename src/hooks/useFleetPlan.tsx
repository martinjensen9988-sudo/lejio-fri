import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FleetPlanType = 'fleet_private' | 'fleet_basic' | 'fleet_premium' | null;

export interface FleetSettlement {
  id: string;
  lessor_id: string;
  settlement_month: string;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  net_payout: number;
  bookings_count: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface FleetPlanInfo {
  type: FleetPlanType;
  commissionRate: number | null;
}

// Fleet plan details
export const FLEET_PLANS = {
  fleet_private: {
    name: 'Privat Fleet',
    description: 'LEJIO varetager udlejningen af dine private biler',
    commissionRate: 30,
    features: [
      'Booking og kalender-styring',
      'Kundeservice og support',
      'Kontrakt-generering',
      'Betalingshåndtering',
      'Afregning og fakturering',
      'Skaderapporter',
    ],
    forPrivate: true,
  },
  fleet_basic: {
    name: 'Fleet Basic',
    description: 'LEJIO varetager alt med udlejning af dine biler',
    commissionRate: 20,
    features: [
      'Booking og kalender-styring',
      'Kundeservice og support',
      'Kontrakt-generering',
      'Betalingshåndtering',
      'Afregning og fakturering',
      'Skaderapporter',
    ],
    forPrivate: false,
  },
  fleet_premium: {
    name: 'Fleet Premium',
    description: 'Fuld service - vi tager os af alt!',
    commissionRate: 35,
    features: [
      'Alt fra Fleet Basic',
      'Udlevering af biler til lejere',
      'Afhentning ved lejeperiodens udløb',
      'Professionel rengøring',
      'Genudlejning og vedligeholdelse',
      'Månedlig opgørelse og udbetaling',
    ],
    forPrivate: false,
  },
};

export const useFleetPlan = () => {
  const { user, profile } = useAuth();
  const [settlements, setSettlements] = useState<FleetSettlement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentPlan: FleetPlanInfo = {
    type: (profile)?.fleet_plan || null,
    commissionRate: (profile)?.fleet_commission_rate || null,
  };

  const fetchSettlements = async () => {
    if (!user) {
      setSettlements([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fleet_settlements')
        .select('*')
        .eq('lessor_id', user.id)
        .order('settlement_month', { ascending: false });

      if (error) throw error;
      setSettlements(data || []);
    } catch (err) {
      console.error('Error fetching settlements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestFleetPlan = async (planType: 'fleet_private' | 'fleet_basic' | 'fleet_premium'): Promise<boolean> => {
    if (!user) {
      toast.error('Du skal være logget ind');
      return false;
    }

    try {
      const commissionRate = FLEET_PLANS[planType].commissionRate;
      
      const { error } = await supabase
        .from('profiles')
        .update({
          fleet_plan: planType,
          fleet_commission_rate: commissionRate,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success(`${FLEET_PLANS[planType].name} er nu aktiveret!`);
      return true;
    } catch (err) {
      console.error('Error updating fleet plan:', err);
      toast.error('Kunne ikke opdatere fleet plan');
      return false;
    }
  };

  const cancelFleetPlan = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          fleet_plan: null,
          fleet_commission_rate: null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Fleet plan er nu annulleret');
      return true;
    } catch (err) {
      console.error('Error cancelling fleet plan:', err);
      toast.error('Kunne ikke annullere fleet plan');
      return false;
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [user]);

  return {
    currentPlan,
    settlements,
    isLoading,
    requestFleetPlan,
    cancelFleetPlan,
    refetch: fetchSettlements,
  };
};
