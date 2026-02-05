import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface ReferralCode {
  id: string;
  user_id: string;
  code: string;
  total_referrals: number;
  total_credit_earned: number;
  available_credit: number;
  created_at: string;
}

export interface ReferralRedemption {
  id: string;
  referral_code_id: string;
  referred_user_id: string;
  booking_id: string | null;
  referrer_credit: number;
  referred_discount: number;
  status: 'pending' | 'completed' | 'expired';
  completed_at: string | null;
  created_at: string;
}

export const useReferral = () => {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<ReferralCode | null>(null);
  const [redemptions, setRedemptions] = useState<ReferralRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralData = useCallback(async () => {
    if (!user) {
      setReferralCode(null);
      setRedemptions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch or create referral code
      let { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (codeError && codeError.code === 'PGRST116') {
        // No code exists, create one
        const { data: newCode } = await supabase.rpc('generate_referral_code');
        
        const { data: insertedCode, error: insertError } = await supabase
          .from('referral_codes')
          .insert({
            user_id: user.id,
            code: newCode || `LEJIO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          })
          .select()
          .single();

        if (!insertError) {
          codeData = insertedCode;
        }
      }

      setReferralCode(codeData as ReferralCode);

      // Fetch redemptions if code exists
      if (codeData) {
        const { data: redemptionData } = await supabase
          .from('referral_redemptions')
          .select('*')
          .eq('referral_code_id', codeData.id)
          .order('created_at', { ascending: false });

        setRedemptions((redemptionData || []) as ReferralRedemption[]);
      }
    } catch (err) {
      console.error('Error fetching referral data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReferralData();
  }, [fetchReferralData]);

  const applyReferralCode = async (code: string) => {
    if (!user) return { success: false, error: 'Ikke logget ind' };

    try {
      // Find the referral code
      const { data: codeData, error: codeError } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();

      if (codeError || !codeData) {
        return { success: false, error: 'Ugyldig henvisningskode' };
      }

      // Can't use your own code
      if (codeData.user_id === user.id) {
        return { success: false, error: 'Du kan ikke bruge din egen henvisningskode' };
      }

      // Check if already redeemed by this user
      const { data: existingRedemption } = await supabase
        .from('referral_redemptions')
        .select('id')
        .eq('referral_code_id', codeData.id)
        .eq('referred_user_id', user.id)
        .single();

      if (existingRedemption) {
        return { success: false, error: 'Du har allerede brugt denne henvisningskode' };
      }

      // Create redemption (pending until first booking)
      const { error: redemptionError } = await supabase
        .from('referral_redemptions')
        .insert({
          referral_code_id: codeData.id,
          referred_user_id: user.id,
          status: 'pending',
        });

      if (redemptionError) throw redemptionError;

      toast.success('Henvisningskode anvendt! Du får 500 kr. rabat på din første månedsleasing');
      return { success: true, discount: 500 };
    } catch (err) {
      console.error('Error applying referral code:', err);
      return { success: false, error: 'Kunne ikke anvende kode' };
    }
  };

  const applyCreditAmount = async (amount: number, bookingId: string) => {
    if (!referralCode || referralCode.available_credit < amount) {
      return { success: false, error: 'Ikke nok kredit' };
    }

    try {
      const { error } = await supabase
        .from('referral_codes')
        .update({
          available_credit: referralCode.available_credit - amount,
        })
        .eq('id', referralCode.id);

      if (error) throw error;

      setReferralCode(prev => prev ? { 
        ...prev, 
        available_credit: prev.available_credit - amount 
      } : null);

      toast.success(`${amount} kr. kredit brugt`);
      return { success: true };
    } catch (err) {
      console.error('Error using credit:', err);
      return { success: false, error: 'Kunne ikke bruge kredit' };
    }
  };

  const getPendingDiscount = async () => {
    if (!user) return null;

    try {
      // Check if user has a pending referral redemption (as referred user)
      const { data } = await supabase
        .from('referral_redemptions')
        .select('id, referred_discount')
        .eq('referred_user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      return data ? { id: data.id, discount: data.referred_discount || 500 } : null;
    } catch (err) {
      console.error('Error checking pending discount:', err);
      return null;
    }
  };

  const completePendingReferral = async (redemptionId: string, bookingId: string) => {
    try {
      // Update redemption to completed
      const { error } = await supabase
        .from('referral_redemptions')
        .update({
          status: 'completed',
          booking_id: bookingId,
          completed_at: new Date().toISOString(),
        })
        .eq('id', redemptionId);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      console.error('Error completing referral:', err);
      return { success: false };
    }
  };

  const copyCodeToClipboard = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      toast.success('Henvisningskode kopieret til udklipsholder');
    }
  };

  const getShareUrl = () => {
    if (!referralCode) return '';
    return `${window.location.origin}/auth?ref=${referralCode.code}`;
  };

  return {
    referralCode,
    redemptions,
    isLoading,
    applyReferralCode,
    applyCreditAmount,
    getPendingDiscount,
    completePendingReferral,
    copyCodeToClipboard,
    getShareUrl,
    refetch: fetchReferralData,
  };
};
