import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriAuthContext } from '@/providers/FriAuthProvider';

const API_BASE = '/api';

/**
 * Hook for fetching lessor dashboard statistics
 */
export function useFriStats() {
  const { user } = useFriAuthContext();

  return useQuery({
    queryKey: ['friStats', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      
      const response = await fetch(
        `${API_BASE}/GetLessorStats?lessor_id=${user.lessor_id}`
      );
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for fetching vehicles
 */
export function useFriVehicles() {
  const { user } = useFriAuthContext();

  return useQuery({
    queryKey: ['friVehicles', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      
      const response = await fetch(
        `${API_BASE}/GetVehicles?lessor_id=${user.lessor_id}`
      );
      if (!response.ok) throw new Error('Failed to fetch vehicles');
      return response.json();
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for creating a vehicle
 */
export function useCreateVehicle() {
  const { user } = useFriAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleData: any) => {
      const response = await fetch(`${API_BASE}/CreateVehicle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessor_id: user?.lessor_id,
          ...vehicleData,
        }),
      });
      if (!response.ok) throw new Error('Failed to create vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friVehicles', user?.lessor_id] });
      queryClient.invalidateQueries({ queryKey: ['friStats', user?.lessor_id] });
    },
  });
}

/**
 * Hook for updating a vehicle
 */
export function useUpdateVehicle() {
  const { user } = useFriAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...vehicleData }: any) => {
      const response = await fetch(`${API_BASE}/UpdateVehicle`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          lessor_id: user?.lessor_id,
          ...vehicleData,
        }),
      });
      if (!response.ok) throw new Error('Failed to update vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friVehicles', user?.lessor_id] });
    },
  });
}

/**
 * Hook for deleting a vehicle
 */
export function useDeleteVehicle() {
  const { user } = useFriAuthContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vehicleId: string) => {
      const response = await fetch(
        `${API_BASE}/DeleteVehicle?id=${vehicleId}&lessor_id=${user?.lessor_id}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to delete vehicle');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friVehicles', user?.lessor_id] });
      queryClient.invalidateQueries({ queryKey: ['friStats', user?.lessor_id] });
    },
  });
}

/**
 * Hook for fetching bookings
 */
export function useFriBookings(status?: string) {
  const { user } = useFriAuthContext();

  const queryParams = new URLSearchParams({
    lessor_id: user?.lessor_id || '',
    ...(status && { status }),
  });

  return useQuery({
    queryKey: ['friBookings', user?.lessor_id, status],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      
      const response = await fetch(
        `${API_BASE}/GetBookings?${queryParams}`
      );
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return response.json();
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for fetching invoices
 */
export function useFriInvoices(status?: string) {
  const { user } = useFriAuthContext();

  const queryParams = new URLSearchParams({
    lessor_id: user?.lessor_id || '',
    ...(status && { status }),
  });

  return useQuery({
    queryKey: ['friInvoices', user?.lessor_id, status],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      
      const response = await fetch(
        `${API_BASE}/GetInvoices?${queryParams}`
      );
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });
}
