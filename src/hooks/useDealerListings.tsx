import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriAuthContext } from '@/providers/FriAuthProvider';

const API_BASE = '/api';

export interface DealerListing {
  id: string;
  title: string;
  reg: string;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDealerListingInput {
  title: string;
  reg_number: string;
  price: number;
  status?: 'available' | 'sold' | 'reserved';
}

export interface UpdateDealerListingInput {
  id: string;
  title?: string;
  price?: number;
  status?: 'available' | 'sold' | 'reserved';
}

export function useDealerListings() {
  const { user } = useFriAuthContext();
  const queryClient = useQueryClient();

  const listingsQuery = useQuery({
    queryKey: ['dealerListings', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/GetDealerListings`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      return (data.listings || data || []) as DealerListing[];
    },
    enabled: !!user?.lessor_id,
    staleTime: 2 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateDealerListingInput) => {
      const response = await fetch(`${API_BASE}/CreateDealerListing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create listing');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerListings', user?.lessor_id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (input: UpdateDealerListingInput) => {
      const response = await fetch(`${API_BASE}/UpdateDealerListing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to update listing');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerListings', user?.lessor_id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_BASE}/DeleteDealerListing`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error('Failed to delete listing');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerListings', user?.lessor_id] });
    },
  });

  return {
    listings: listingsQuery.data || [],
    isLoading: listingsQuery.isLoading,
    error: listingsQuery.error as Error | null,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    refetch: listingsQuery.refetch,
  };
}
