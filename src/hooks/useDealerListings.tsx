import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriAuthContext } from '@/providers/FriAuthProvider';

const API_BASE = '/api';

export interface DealerListing {
  id: string;
  title: string;
  reg: string;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  imageUrl?: string;
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

export interface DealerLoyaltyCard {
  id: string;
  name: string;
  discountPercent: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
}

export interface DealerContract {
  id: string;
  listingId?: string;
  contractType: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  signedAt?: string;
  createdAt: string;
}

export interface DealerCampaign {
  id: string;
  title: string;
  offerText: string;
  targetGroup: string;
  sentCount: number;
  responseCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface ContractSignature {
  id: string;
  signatureCode: string;
  customerName: string;
  customerEmail: string;
  ipAddress: string;
  ipCountry?: string;
  ipCity?: string;
  browser: string;
  os: string;
  device: string;
  signatureTimestamp: string;
  isValid: boolean;
  rejectionReason?: string;
  createdAt: string;
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

  const uploadImageMutation = useMutation({
    mutationFn: async ({ listingId, imageUrl }: { listingId: string; imageUrl: string }) => {
      const response = await fetch(`${API_BASE}/UploadDealerListingImage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId, imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to upload image');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerListings', user?.lessor_id] });
    },
  });

  const loyaltyCardsQuery = useQuery({
    queryKey: ['dealerLoyaltyCards', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/GetDealerLoyaltyCards`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch loyalty cards');
      const data = await response.json();
      return (data.cards || []) as DealerLoyaltyCard[];
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });

  const createLoyaltyCardMutation = useMutation({
    mutationFn: async (input: Omit<DealerLoyaltyCard, 'id' | 'createdAt'>) => {
      const response = await fetch(`${API_BASE}/CreateDealerLoyaltyCard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to create loyalty card');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerLoyaltyCards', user?.lessor_id] });
    },
  });

  const contractsQuery = useQuery({
    queryKey: ['dealerContracts', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/GetDealerContracts`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch contracts');
      const data = await response.json();
      return (data.contracts || []) as DealerContract[];
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });

  const sendContractMutation = useMutation({
    mutationFn: async (input: Partial<DealerContract> & { contractType: string; customerName: string; customerEmail: string }) => {
      const response = await fetch(`${API_BASE}/SendDealerContract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to send contract');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerContracts', user?.lessor_id] });
    },
  });

  const campaignsQuery = useQuery({
    queryKey: ['dealerCampaigns', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/GetDealerCampaigns`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      return (data.campaigns || []) as DealerCampaign[];
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });

  const sendCampaignMutation = useMutation({
    mutationFn: async (input: Omit<DealerCampaign, 'id' | 'sentCount' | 'responseCount' | 'createdAt' | 'isActive'>) => {
      const response = await fetch(`${API_BASE}/SendDealerCampaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to send campaign');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerCampaigns', user?.lessor_id] });
    },
  });

  // Contract signature mutations
  const signContractMutation = useMutation({
    mutationFn: async (input: { contractId: string; customerName: string; customerEmail: string }) => {
      const response = await fetch(`${API_BASE}/SignDealerContract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to sign contract');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dealerContracts', user?.lessor_id] });
    },
  });

  const getSignaturesQuery = (contractId: string | null) => useQuery({
    queryKey: ['contractSignatures', contractId, user?.lessor_id],
    queryFn: async () => {
      if (!contractId || !user?.lessor_id) throw new Error('No contract ID or lessor_id');
      const response = await fetch(`${API_BASE}/GetContractSignatures?contractId=${contractId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch signatures');
      const data = await response.json();
      return (data.signatures || []) as ContractSignature[];
    },
    enabled: !!contractId && !!user?.lessor_id,
  });

  return {
    // Listings
    listings: listingsQuery.data || [],
    isLoading: listingsQuery.isLoading,
    error: listingsQuery.error as Error | null,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    uploadImage: uploadImageMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUploadingImage: uploadImageMutation.isPending,
    refetch: listingsQuery.refetch,

    // Loyalty Cards
    loyaltyCards: loyaltyCardsQuery.data || [],
    loyaltyCardsLoading: loyaltyCardsQuery.isLoading,
    createLoyaltyCard: createLoyaltyCardMutation.mutateAsync,
    isCreatingLoyaltyCard: createLoyaltyCardMutation.isPending,

    // Contracts
    contracts: contractsQuery.data || [],
    contractsLoading: contractsQuery.isLoading,
    sendContract: sendContractMutation.mutateAsync,
    isSendingContract: sendContractMutation.isPending,

    // Campaigns
    campaigns: campaignsQuery.data || [],
    campaignsLoading: campaignsQuery.isLoading,
    sendCampaign: sendCampaignMutation.mutateAsync,
    isSendingCampaign: sendCampaignMutation.isPending,

    // Contract Signatures
    signContract: signContractMutation.mutateAsync,
    isSigningContract: signContractMutation.isPending,
    getSignatures: getSignaturesQuery,
  };
}
