import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface TeamMember {
  id: string;
  lessor_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer';
  status: 'invited' | 'active' | 'inactive';
  joined_date?: string;
  last_active?: string;
  created_at: string;
  updated_at: string;
}

export interface InviteTeamMemberInput {
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'viewer';
}

export function useFriTeam(lessorId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const escapeSqlValue = (value: string) => value.replace(/'/g, "''");

  const normalizeRows = (response: any) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.recordset)) return response.recordset;
    if (Array.isArray(response.data?.recordset)) return response.data.recordset;
    return response.data ?? response;
  };

  // Fetch all team members
  const fetch = useCallback(async () => {
    if (!lessorId) return;

    setLoading(true);
    setError(null);

    try {
      const safeLessorId = escapeSqlValue(lessorId);
      const response = await azureApi.post<any>('/db/query', {
        query: `SELECT * FROM fri_lessor_team_members WHERE lessor_id='${safeLessorId}' ORDER BY created_at ASC`,
      });

      const rows = normalizeRows(response) as TeamMember[];
      setMembers(rows || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch team members';
      setError(message);
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  // Auto-fetch when component mounts or lessorId changes
  useEffect(() => {
    if (lessorId) {
      fetch();
    }
  }, [lessorId, fetch]);

  // Invite a new team member
  const inviteMember = useCallback(
    async (input: InviteTeamMemberInput) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        // Check if member already exists
        const safeLessorId = escapeSqlValue(lessorId);
        const safeEmail = escapeSqlValue(input.email);

        const existsResponse = await azureApi.post<any>('/db/query', {
          query: `SELECT id FROM fri_lessor_team_members WHERE lessor_id='${safeLessorId}' AND email='${safeEmail}'`,
        });

        const existingRows = normalizeRows(existsResponse);
        if (existingRows?.[0]) {
          throw new Error('This email is already part of the team');
        }

        await azureApi.post('/db/query', {
          query: `INSERT INTO fri_lessor_team_members (lessor_id, email, full_name, role, status) VALUES ('${safeLessorId}', '${safeEmail}', '${escapeSqlValue(input.full_name)}', '${escapeSqlValue(input.role)}', 'invited')`,
        });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to invite member';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Update member role
  const updateRole = useCallback(
    async (id: string, role: TeamMember['role']) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        await azureApi.post('/db/query', {
          query: `UPDATE fri_lessor_team_members SET role='${escapeSqlValue(role)}' WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Update member status
  const updateStatus = useCallback(
    async (id: string, status: TeamMember['status']) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        await azureApi.post('/db/query', {
          query: `UPDATE fri_lessor_team_members SET status='${escapeSqlValue(status)}' WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update status';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Remove team member
  const removeMember = useCallback(
    async (id: string) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        await azureApi.post('/db/query', {
          query: `DELETE FROM fri_lessor_team_members WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        setMembers((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to remove member';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Resend invitation
  const resendInvitation = useCallback(
    async (id: string) => {
      if (!lessorId) throw new Error('Lessor ID is required');

      try {
        setError(null);

        // Update status to invited
        await azureApi.post('/db/query', {
          query: `UPDATE fri_lessor_team_members SET status='invited' WHERE id='${escapeSqlValue(id)}' AND lessor_id='${escapeSqlValue(lessorId)}'`,
        });

        await fetch();
        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to resend invitation';
        setError(message);
        throw err;
      }
    },
    [lessorId]
  );

  // Get role label
  const getRoleLabel = (role: TeamMember['role']): string => {
    const labels: Record<TeamMember['role'], string> = {
      owner: 'Ejer',
      admin: 'Administrator',
      manager: 'Manager',
      viewer: 'Læser',
    };
    return labels[role];
  };

  // Get role description
  const getRoleDescription = (role: TeamMember['role']): string => {
    const descriptions: Record<TeamMember['role'], string> = {
      owner: 'Fuld adgang og kan administrere andre medlemmer',
      admin: 'Fuld adgang til alle funktioner',
      manager: 'Kan administrere køretøjer, bookinger og fakturaer',
      viewer: 'Læseadgang til alle data',
    };
    return descriptions[role];
  };

  return {
    members,
    loading,
    error,
    refetch: fetch,
    inviteMember,
    updateRole,
    updateStatus,
    removeMember,
    resendInvitation,
    getRoleLabel,
    getRoleDescription,
  };
}
