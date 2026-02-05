import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface LessorRating {
  id: string;
  booking_id: string;
  lessor_id: string;
  renter_id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface LessorStats {
  average_rating: number;
  total_rating_count: number;
  lessor_status: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const useLessorRatings = (lessorId?: string) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<LessorRating[]>([]);
  const [stats, setStats] = useState<LessorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatings = async () => {
    if (!lessorId) {
      setRatings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessor_ratings')
        .select('*')
        .eq('lessor_id', lessorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings(data || []);
    } catch (err) {
      console.error('Error fetching ratings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!lessorId) {
      setStats(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('average_rating, total_rating_count, lessor_status')
        .eq('id', lessorId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setStats({
          average_rating: data.average_rating || 0,
          total_rating_count: data.total_rating_count || 0,
          lessor_status: (data.lessor_status as LessorStats['lessor_status']) || 'bronze',
        });
      }
    } catch (err) {
      console.error('Error fetching lessor stats:', err);
    }
  };

  const submitRating = async (
    bookingId: string,
    lessorId: string,
    rating: number,
    reviewText?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Du skal være logget ind for at give en vurdering');
      return false;
    }

    try {
      const { error } = await supabase
        .from('lessor_ratings')
        .insert({
          booking_id: bookingId,
          lessor_id: lessorId,
          renter_id: user.id,
          rating,
          review_text: reviewText || null,
        });

      if (error) throw error;

      toast.success('Tak for din vurdering!');
      await fetchRatings();
      await fetchStats();
      return true;
    } catch (err: unknown) {
      console.error('Error submitting rating:', err);
      if (err.code === '23505') {
        toast.error('Du har allerede vurderet denne booking');
      } else {
        toast.error('Kunne ikke gemme vurdering');
      }
      return false;
    }
  };

  const hasRatedBooking = async (bookingId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('lessor_ratings')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('renter_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking rating:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchRatings();
    fetchStats();
  }, [lessorId]);

  return {
    ratings,
    stats,
    isLoading,
    submitRating,
    hasRatedBooking,
    refetch: () => {
      fetchRatings();
      fetchStats();
    },
  };
};

// Status badge utilities
export const getStatusLabel = (status: LessorStats['lessor_status']): string => {
  const labels: Record<LessorStats['lessor_status'], string> = {
    bronze: 'Bronze',
    silver: 'Sølv',
    gold: 'Guld',
    platinum: 'Platin',
  };
  return labels[status];
};

export const getStatusColor = (status: LessorStats['lessor_status']): string => {
  const colors: Record<LessorStats['lessor_status'], string> = {
    bronze: 'bg-amber-700 text-amber-100',
    silver: 'bg-slate-400 text-slate-900',
    gold: 'bg-yellow-500 text-yellow-900',
    platinum: 'bg-gradient-to-r from-indigo-400 to-purple-500 text-white',
  };
  return colors[status];
};

export const getNextStatusRequirements = (
  status: LessorStats['lessor_status'],
  currentRating: number,
  currentCount: number
): string | null => {
  if (status === 'platinum') return null;
  
  if (status === 'gold') {
    const needRating = currentRating < 4.8;
    const needCount = currentCount < 50;
    if (needRating && needCount) {
      return `Du mangler ${(4.8 - currentRating).toFixed(1)} i rating og ${50 - currentCount} anmeldelser for at nå Platin`;
    } else if (needRating) {
      return `Du mangler ${(4.8 - currentRating).toFixed(1)} i rating for at nå Platin`;
    } else if (needCount) {
      return `Du mangler ${50 - currentCount} anmeldelser for at nå Platin`;
    }
  }
  
  if (status === 'silver') {
    const needRating = currentRating < 4.5;
    const needCount = currentCount < 25;
    if (needRating && needCount) {
      return `Du mangler ${(4.5 - currentRating).toFixed(1)} i rating og ${25 - currentCount} anmeldelser for at nå Guld`;
    } else if (needRating) {
      return `Du mangler ${(4.5 - currentRating).toFixed(1)} i rating for at nå Guld`;
    } else if (needCount) {
      return `Du mangler ${25 - currentCount} anmeldelser for at nå Guld`;
    }
  }
  
  if (status === 'bronze') {
    const needRating = currentRating < 4.0;
    const needCount = currentCount < 10;
    if (needRating && needCount) {
      return `Du mangler ${(4.0 - currentRating).toFixed(1)} i rating og ${10 - currentCount} anmeldelser for at nå Sølv`;
    } else if (needRating) {
      return `Du mangler ${(4.0 - currentRating).toFixed(1)} i rating for at nå Sølv`;
    } else if (needCount) {
      return `Du mangler ${10 - currentCount} anmeldelser for at nå Sølv`;
    }
  }
  
  return null;
};
