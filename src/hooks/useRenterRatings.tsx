import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface RenterRating {
  id: string;
  booking_id: string;
  lessor_id: string;
  renter_id: string | null;
  renter_email: string;
  renter_name: string | null;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface RenterStats {
  average_rating: number;
  total_ratings: number;
}

export const useRenterRatings = (renterEmail?: string) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<RenterRating[]>([]);
  const [stats, setStats] = useState<RenterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatings = async () => {
    if (!renterEmail) {
      setRatings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('renter_ratings')
        .select('*')
        .eq('renter_email', renterEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRatings((data as RenterRating[]) || []);
    } catch (err) {
      console.error('Error fetching renter ratings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!renterEmail) {
      setStats(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('get_renter_rating_stats', { renter_email_input: renterEmail });

      if (error) throw error;
      if (data && data.length > 0) {
        setStats({
          average_rating: Number(data[0].average_rating) || 0,
          total_ratings: data[0].total_ratings || 0,
        });
      }
    } catch (err) {
      console.error('Error fetching renter stats:', err);
    }
  };

  const submitRating = async (
    bookingId: string,
    renterEmail: string,
    renterName: string | null,
    renterId: string | null,
    rating: number,
    reviewText?: string
  ): Promise<boolean> => {
    if (!user) {
      toast.error('Du skal være logget ind for at give en vurdering');
      return false;
    }

    try {
      const { error } = await supabase
        .from('renter_ratings')
        .insert({
          booking_id: bookingId,
          lessor_id: user.id,
          renter_id: renterId,
          renter_email: renterEmail,
          renter_name: renterName,
          rating,
          review_text: reviewText || null,
        });

      if (error) throw error;

      toast.success('Tak for din vurdering af lejeren!');
      await fetchRatings();
      await fetchStats();
      return true;
    } catch (err: unknown) {
      console.error('Error submitting renter rating:', err);
      if (err.code === '23505') {
        toast.error('Du har allerede vurderet denne lejer for denne booking');
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
        .from('renter_ratings')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('lessor_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (err) {
      console.error('Error checking renter rating:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchRatings();
    fetchStats();
  }, [renterEmail]);

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

// Get rating label based on average
export const getRenterRatingLabel = (averageRating: number): string => {
  if (averageRating >= 4.5) return 'Fremragende lejer';
  if (averageRating >= 4.0) return 'God lejer';
  if (averageRating >= 3.0) return 'Okay lejer';
  if (averageRating >= 2.0) return 'Under middel';
  if (averageRating > 0) return 'Problematisk';
  return 'Ingen vurderinger';
};

// Get color class based on rating
export const getRenterRatingColor = (averageRating: number): string => {
  if (averageRating >= 4.5) return 'text-green-600 bg-green-100';
  if (averageRating >= 4.0) return 'text-emerald-600 bg-emerald-100';
  if (averageRating >= 3.0) return 'text-yellow-600 bg-yellow-100';
  if (averageRating >= 2.0) return 'text-orange-600 bg-orange-100';
  if (averageRating > 0) return 'text-red-600 bg-red-100';
  return 'text-muted-foreground bg-muted';
};
