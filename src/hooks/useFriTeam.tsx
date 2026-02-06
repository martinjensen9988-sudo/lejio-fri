import { useState, useEffect, useCallback } from 'react';
import { azureApi } from '@/integrations/azure/client';

export interface TeamMember {
  id: string;
  lessor_id: string;
  email: string;
  full_name: string;
  name?: string;
  role: 'owner' | 'admin' | 'manager' | 'viewer';
  status: 'invited' | 'active' | 'inactive';
  joined_date?: string;
  last_active?: string;
  created_at: string;
  updated_at?: string;
}

export interface InviteTeamMemberInput {
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'viewer';
}

const esc = (v: string) => v.replace(/'/g, "''");

const normalizeRows = (response: any) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.recordset)) return response.recordset;
  if (Array.isArray(response.data?.recordset)) return response.data.recordset;
  return response.data ?? response;
};

export function useFriTeam(lessorId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!lessorId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await azureApi.post<any>('/db-query', {
        query: `SELECT *, name AS full_name FROM fri_lessor_team_members WHERE lessor_id='${esc(lessorId)}' ORDER BY created_at ASC`,
      });
      setMembers((normalizeRows(response) as TeamMember[]) || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  }, [lessorId]);

  useEffect(() => { if (lessorId) fetchMembers(); }, [lessorId, fetchMembers]);

  const inviteMember = useCallback(async (input: InviteTeamMemberInput) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);

    // Check if already exists
    const existsRes = await azureApi.post<any>('/db-query', {
      query: `SELECT id FROM fri_lessor_team_members WHERE lessor_id='${esc(lessorId)}' AND email='${esc(input.email)}'`,
    });
    const existing = normalizeRows(existsRes);
    if (existing?.[0]) throw new Error('This email is already part of the team');

    await azureApi.post('/db-query', {
      query: `INSERT INTO fri_lessor_team_members (lessor_id, email, name, role, status)
              VALUES ('${esc(lessorId)}', '${esc(input.email)}', '${esc(input.full_name)}', '${esc(input.role)}', 'invited')`,
    });
    await fetchMembers();
    return null;
  }, [lessorId, fetchMembers]);

  const updateRole = useCallback(async (id: string, role: TeamMember['role']) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `UPDATE fri_lessor_team_members SET role='${esc(role)}' WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    await fetchMembers();
    return null;
  }, [lessorId, fetchMembers]);

  const updateStatus = useCallback(async (id: string, status: TeamMember['status']) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `UPDATE fri_lessor_team_members SET status='${esc(status)}' WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    await fetchMembers();
    return null;
  }, [lessorId, fetchMembers]);

  const removeMember = useCallback(async (id: string) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `DELETE FROM fri_lessor_team_members WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    setMembers(prev => prev.filter(m => m.id !== id));
  }, [lessorId]);

  const resendInvitation = useCallback(async (id: string) => {
    if (!lessorId) throw new Error('Lessor ID is required');
    setError(null);
    await azureApi.post('/db-query', {
      query: `UPDATE fri_lessor_team_members SET status='invited' WHERE id='${esc(id)}' AND lessor_id='${esc(lessorId)}'`,
    });
    await fetchMembers();
    return null;
  }, [lessorId, fetchMembers]);

  const getRoleLabel = (role: TeamMember['role']): string => {
    const labels: Record<TeamMember['role'], string> = { owner: 'Ejer', admin: 'Administrator', manager: 'Manager', viewer: 'Læser' };
    return labels[role];
  };

  const getRoleDescription = (role: TeamMember['role']): string => {
    const desc: Record<TeamMember['role'], string> = {
      owner: 'Fuld adgang og kan administrere andre medlemmer',
      admin: 'Fuld adgang til alle funktioner',
      manager: 'Kan administrere køretøjer, bookinger og fakturaer',
      viewer: 'Læseadgang til alle data',
    };
    return desc[role];
  };

  return { members, loading, error, refetch: fetchMembers, inviteMember, updateRole, updateStatus, removeMember, resendInvitation, getRoleLabel, getRoleDescription };
}
