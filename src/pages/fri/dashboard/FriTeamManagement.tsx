import { useState, useEffect } from 'react';
import { useFriLessor, type FriTeamMember, type FriLessor } from '@/hooks/useFriLessor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { azureApi } from '@/integrations/azure/client';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface TeamMemberForm {
  full_name: string;
  email: string;
  phone: string;
  role: 'manager' | 'driver' | 'mechanic' | 'accountant';
  is_active: boolean;
}

const FriTeamManagement = () => {
  const { teamMembers, friLessor, refetch, isLoading } = useFriLessor();
  const [filteredMembers, setFilteredMembers] = useState<FriTeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FriTeamMember | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<TeamMemberForm>({
    full_name: '',
    email: '',
    phone: '',
    role: 'driver',
    is_active: true,
  });

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    applyFilters();
  }, [teamMembers, searchQuery, filterRole, filterStatus]);

  const applyFilters = () => {
    let filtered = teamMembers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
    }

    if (filterRole && filterRole !== 'all') {
      filtered = filtered.filter((m) => m.role === filterRole);
    }

    if (filterStatus === 'active') {
      filtered = filtered.filter((m) => m.is_active);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter((m) => !m.is_active);
    }

    setFilteredMembers(filtered);
  };

  const handleEdit = (member: FriTeamMember) => {
    setSelectedMember(member);
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || '',
      role: member.role,
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setSelectedMember(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'driver',
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.full_name || !formData.email) {
      toast.error('Navn og email er påkrævet');
      return;
    }

    setIsSaving(true);
    try {
      if (selectedMember) {
        // Update existing
        await azureApi.put('/db/fri_lessor_team_members', {
          id: selectedMember.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          role: formData.role,
          is_active: formData.is_active,
        });
        toast.success('Teammedlem opdateret');
      } else {
        // Create new
        await azureApi.post('/db/fri_lessor_team_members', {
          records: [
            {
              lessor_id: friLessor?.id || '',
              full_name: formData.full_name,
              email: formData.email,
              phone: formData.phone || null,
              role: formData.role,
              is_active: true,
            },
          ],
        });
        toast.success('Teammedlem oprettet');
      }

      await refetch();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Kunne ikke gemme teammedlem');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    setIsSaving(true);
    try {
      await azureApi.put('/db/fri_lessor_team_members', {
        id: selectedMember.id,
        is_active: false,
      });
      toast.success('Teammedlem deaktiveret');
      await refetch();
      setIsDeleteAlertOpen(false);
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Kunne ikke slette teammedlem');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      manager: 'Manager',
      driver: 'Chauffør',
      mechanic: 'Mekaniker',
      accountant: 'Regnskabsmedarbeyder',
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      manager: 'bg-purple-50',
      driver: 'bg-blue-50',
      mechanic: 'bg-orange-50',
      accountant: 'bg-green-50',
    };
    return colors[role] || 'bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overskrift */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Teammedlemmer</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew}>
              <Plus className="w-4 h-4 mr-2" />
              Tilføj Teammedlem
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMember ? 'Rediger Teammedlem' : 'Opret Nyt Teammedlem'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Fuldt Navn *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="navn@ditdomæne.dk"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+45 12 34 56 78"
                />
              </div>
              <div>
                <Label htmlFor="role">Rolle</Label>
                <Select value={formData.role} onValueChange={(val) => 
                  setFormData({ ...formData, role: val as any })
                }>
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg rolle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="driver">Chauffør</SelectItem>
                    <SelectItem value="mechanic">Mekaniker</SelectItem>
                    <SelectItem value="accountant">Regnskabsmedarbeyder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked as boolean })
                  }
                />
                <Label htmlFor="is_active" className="cursor-pointer">
                  Aktivt medlem
                </Label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Gemmer...
                    </>
                  ) : (
                    'Gem'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSaving}
                >
                  Annuller
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistik kort */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktive Medlemmer</p>
                <p className="text-3xl font-bold">{teamMembers.filter((m) => m.is_active).length}</p>
              </div>
              <Users className="w-10 h-10 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-3xl font-bold">{teamMembers.filter((m) => m.role === 'manager').length}</p>
              </div>
              <Shield className="w-10 h-10 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Chaufører</p>
                <p className="text-3xl font-bold">{teamMembers.filter((m) => m.role === 'driver').length}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtre og tabel */}
      <Card>
        <CardHeader>
          <CardTitle>Teammedlemmer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Input
              placeholder="Søg efter navn eller email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-w-[200px]"
            />
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer rolle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle roller</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="driver">Chauffør</SelectItem>
                <SelectItem value="mechanic">Mekaniker</SelectItem>
                <SelectItem value="accountant">Regnskabsmedarbeyder</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={(val) => 
              setFilterStatus(val as 'all' | 'active' | 'inactive')
            }>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="active">Aktive</SelectItem>
                <SelectItem value="inactive">Inaktive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabel */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Navn</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Ingen teammedlemmer matcher søgningen
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.full_name}</TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={member.is_active ? 'default' : 'secondary'}>
                          {member.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMember(member);
                              setIsDeleteAlertOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredMembers.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Viser {filteredMembers.length} af {teamMembers.length} medlemmer
            </p>
          )}
        </CardContent>
      </Card>

      {/* Bekræftelse af sletning */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
      <AlertDialogContent>
        <AlertDialogTitle>Er du sikker?</AlertDialogTitle>
        <AlertDialogDescription>
          Denne handling vil deaktivere "{selectedMember?.full_name}". De vil ikke længere kunne tilgå systemet.
        </AlertDialogDescription>
        <div className="flex gap-3">
          <AlertDialogCancel>Annuller</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isSaving}
            className="bg-destructive"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sletter...
              </>
            ) : (
              'Deaktiver'
            )}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
};

export default FriTeamManagement;
