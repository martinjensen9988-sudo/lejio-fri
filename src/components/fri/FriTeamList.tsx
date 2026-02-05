import { useFriTeam, TeamMember, InviteTeamMemberInput } from '@/hooks/useFriTeam';
import { useState } from 'react';
import { AlertCircle, Trash2, Plus, Users, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FriTeamInviteForm } from './FriTeamInviteForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FriTeamListProps {
  lessorId: string | null;
}

const statusColors: Record<string, string> = {
  invited: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

const statusLabel: Record<string, string> = {
  invited: 'Inviteret',
  active: 'Aktiv',
  inactive: 'Inaktiv',
};

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  manager: 'bg-indigo-100 text-indigo-800',
  viewer: 'bg-gray-100 text-gray-800',
};

export function FriTeamList({ lessorId }: FriTeamListProps) {
  const {
    members,
    loading,
    error,
    inviteMember,
    updateRole,
    removeMember,
    resendInvitation,
    getRoleLabel,
    getRoleDescription,
  } = useFriTeam(lessorId);

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  const handleInviteMember = async (data: InviteTeamMemberInput) => {
    try {
      setFormError(null);
      await inviteMember(data);
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error inviting member');
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      setFormError(null);
      await removeMember(id);
      setDeleteId(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  const handleChangeRole = async (id: string, newRole: TeamMember['role']) => {
    try {
      setFormError(null);
      setChangingRole(id);
      await updateRole(id, newRole);
      setChangingRole(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error updating role');
      setChangingRole(null);
    }
  };

  const handleResendInvitation = async (id: string) => {
    try {
      setFormError(null);
      await resendInvitation(id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error resending invitation');
    }
  };

  if (showForm) {
    return (
      <FriTeamInviteForm
        onSubmit={handleInviteMember}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  if (loading) {
    return <div className="text-center py-8">Indlæser teammedlemmer...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Teammedlemmer</h2>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Inviter medlem
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Fejl ved indlæsning</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {formError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {members.length === 0 ? (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">Du er den eneste medlem for øjeblikket</p>
          <Button onClick={() => setShowForm(true)}>Inviter første medlem</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{member.full_name}</h3>
                  <Badge className={statusColors[member.status]}>
                    {statusLabel[member.status]}
                  </Badge>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="text-gray-500">Email:</span>{' '}
                    <a href={`mailto:${member.email}`} className="text-blue-600 hover:underline">
                      {member.email}
                    </a>
                  </p>

                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-gray-500">Rolle:</span>
                    <Select
                      value={member.role}
                      onValueChange={(value: any) => handleChangeRole(member.id, value)}
                      disabled={changingRole === member.id}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div>Administrator</div>
                        </SelectItem>
                        <SelectItem value="manager">
                          <div>Manager</div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div>Læser</div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <p className="text-xs text-gray-500 italic mt-1">
                    {getRoleDescription(member.role)}
                  </p>

                  {member.joined_date && (
                    <p className="text-xs text-gray-500">
                      Tilsluttet: {new Date(member.joined_date).toLocaleDateString('da-DK')}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                {member.status === 'invited' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResendInvitation(member.id)}
                    className="mt-3 text-xs gap-1"
                  >
                    <Send className="w-3 h-3" /> Gensend invitation
                  </Button>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteId(member.id)}
                className="gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fjern medlem?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil fjerne dette medlem fra teamet? De vil miste adgang til systemet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && handleDeleteMember(deleteId)}
            >
              Fjern
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
