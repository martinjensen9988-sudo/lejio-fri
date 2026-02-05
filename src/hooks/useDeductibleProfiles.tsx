import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface DeductibleProfile {
  id: string;
  lessor_id: string;
  name: string;
  description: string | null;
  base_deductible: number;
  premium_deductible: number;
  premium_daily_rate: number;
  min_renter_rating: number | null;
  min_completed_bookings: number | null;
  max_vehicle_value: number | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface BookingDeductibleSelection {
  id: string;
  booking_id: string;
  deductible_profile_id: string | null;
  selected_tier: 'standard' | 'premium';
  deductible_amount: number;
  daily_premium_paid: number;
  total_premium_paid: number;
  created_at: string;
}

export type CreateDeductibleProfileInput = Omit<DeductibleProfile, 'id' | 'lessor_id' | 'created_at'>;

export const useDeductibleProfiles = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<DeductibleProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('deductible_profiles')
        .select('*')
        .eq('lessor_id', user.id)
        .order('is_default', { ascending: false })
        .order('base_deductible', { ascending: true });

      if (error) throw error;
      setProfiles((data || []) as unknown as DeductibleProfile[]);
    } catch (err) {
      console.error('Error fetching deductible profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createProfile = async (input: CreateDeductibleProfileInput): Promise<DeductibleProfile | null> => {
    if (!user) return null;

    try {
      // If this is set as default, unset other defaults
      if (input.is_default) {
        await supabase
          .from('deductible_profiles')
          .update({ is_default: false })
          .eq('lessor_id', user.id);
      }

      const { data, error } = await supabase
        .from('deductible_profiles')
        .insert({
          ...input,
          lessor_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Selvrisiko-profil oprettet');
      await fetchProfiles();
      return data as unknown as DeductibleProfile;
    } catch (err) {
      console.error('Error creating profile:', err);
      toast.error('Kunne ikke oprette profil');
      return null;
    }
  };

  const updateProfile = async (id: string, updates: Partial<DeductibleProfile>): Promise<boolean> => {
    if (!user) return false;

    try {
      // If setting as default, unset other defaults
      if (updates.is_default) {
        await supabase
          .from('deductible_profiles')
          .update({ is_default: false })
          .eq('lessor_id', user.id)
          .neq('id', id);
      }

      const { error } = await supabase
        .from('deductible_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      toast.success('Profil opdateret');
      return true;
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Kunne ikke opdatere profil');
      return false;
    }
  };

  const deleteProfile = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('deductible_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== id));
      toast.success('Profil slettet');
      return true;
    } catch (err) {
      console.error('Error deleting profile:', err);
      toast.error('Kunne ikke slette profil');
      return false;
    }
  };

  const getProfileForRenter = async (renterEmail: string, vehicleValue?: number): Promise<DeductibleProfile | null> => {
    if (!user || profiles.length === 0) return null;

    try {
      // Get renter stats
      const { data: ratingData } = await supabase.rpc('get_renter_rating_stats', {
        renter_email_input: renterEmail
      });

      const avgRating = ratingData?.[0]?.average_rating || 0;
      const totalRatings = ratingData?.[0]?.total_ratings || 0;

      // Find best matching profile
      const matchingProfiles = profiles.filter(p => {
        if (!p.is_active) return false;
        if (p.min_renter_rating && avgRating < p.min_renter_rating) return false;
        if (p.min_completed_bookings && totalRatings < p.min_completed_bookings) return false;
        if (p.max_vehicle_value && vehicleValue && vehicleValue > p.max_vehicle_value) return false;
        return true;
      });

      // Return profile with lowest deductible
      if (matchingProfiles.length > 0) {
        return matchingProfiles.sort((a, b) => a.base_deductible - b.base_deductible)[0];
      }

      // Return default profile
      return profiles.find(p => p.is_default) || profiles[0] || null;
    } catch (err) {
      console.error('Error getting profile for renter:', err);
      return profiles.find(p => p.is_default) || null;
    }
  };

  const selectDeductibleForBooking = async (
    bookingId: string,
    profileId: string | null,
    tier: 'standard' | 'premium',
    rentalDays: number
  ): Promise<BookingDeductibleSelection | null> => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      const deductibleAmount = tier === 'premium' 
        ? (profile?.premium_deductible || 0)
        : (profile?.base_deductible || 5000);
      const dailyPremium = tier === 'premium' ? (profile?.premium_daily_rate || 79) : 0;

      const { data, error } = await supabase
        .from('booking_deductible_selections')
        .insert({
          booking_id: bookingId,
          deductible_profile_id: profileId,
          selected_tier: tier,
          deductible_amount: deductibleAmount,
          daily_premium_paid: dailyPremium,
          total_premium_paid: dailyPremium * rentalDays
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BookingDeductibleSelection;
    } catch (err) {
      console.error('Error selecting deductible:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  return {
    profiles,
    isLoading,
    createProfile,
    updateProfile,
    deleteProfile,
    getProfileForRenter,
    selectDeductibleForBooking,
    refetch: fetchProfiles
  };
};
