import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFriAuthContext } from '@/providers/FriAuthProvider';

const API_BASE = '/api';

export interface FriModuleRecord {
  id: string;
  lessor_id: string;
  module_id: string;
  status: 'active' | 'inactive';
  activated_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export function useFriModules() {
  const { user } = useFriAuthContext();
  const queryClient = useQueryClient();

  const modulesQuery = useQuery({
    queryKey: ['friModules', user?.lessor_id],
    queryFn: async () => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/GetModules?lessor_id=${user.lessor_id}`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      const data = await response.json();
      return (data.modules || []) as FriModuleRecord[];
    },
    enabled: !!user?.lessor_id,
    staleTime: 5 * 60 * 1000,
  });

  const setModuleMutation = useMutation({
    mutationFn: async ({ moduleId, enabled }: { moduleId: string; enabled: boolean }) => {
      if (!user?.lessor_id) throw new Error('No lessor_id');
      const response = await fetch(`${API_BASE}/SetModule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessor_id: user.lessor_id,
          module_id: moduleId,
          enabled,
        }),
      });
      if (!response.ok) throw new Error('Failed to update module');
      const data = await response.json();
      return data.module as FriModuleRecord | null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friModules', user?.lessor_id] });
    },
  });

  return {
    modules: modulesQuery.data || [],
    isLoading: modulesQuery.isLoading,
    error: modulesQuery.error as Error | null,
    setModule: setModuleMutation.mutateAsync,
    isUpdating: setModuleMutation.isPending,
  };
}
