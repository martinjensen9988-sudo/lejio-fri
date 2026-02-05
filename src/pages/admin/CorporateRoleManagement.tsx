import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/azure/client';

interface CorporateRole {
  id: string;
  corporate_account_id: string;
  name: string;
  description: string;
  permissions: string[];
  employee_count: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

interface Permission {
  id: string;
  key: string;
  label: string;
  description: string;
  category: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  // Medarbejdere
  { id: '1', key: 'employees.view', label: 'Se medarbejdere', description: 'Se liste over medarbejdere', category: 'Medarbejdere' },
  { id: '2', key: 'employees.create', label: 'Opret medarbejder', description: 'Tilføj nye medarbejdere', category: 'Medarbejdere' },
  { id: '3', key: 'employees.edit', label: 'Rediger medarbejder', description: 'Rediger medarbejderoplysninger', category: 'Medarbejdere' },
  { id: '4', key: 'employees.delete', label: 'Slet medarbejder', description: 'Fjern medarbejdere', category: 'Medarbejdere' },
  
  // Budget
  { id: '5', key: 'budget.view', label: 'Se budget', description: 'Se budgetoversigt og rapport', category: 'Budget' },
  { id: '6', key: 'budget.edit', label: 'Rediger budget', description: 'Ændre budgetgrænser', category: 'Budget' },
  { id: '7', key: 'budget.approve', label: 'Godkend budget', description: 'Godkende budgetoverstigelser', category: 'Budget' },
  
  // Rapporter
  { id: '8', key: 'reports.view', label: 'Se rapporter', description: 'Se settlement-rapporter', category: 'Rapporter' },
  { id: '9', key: 'reports.export', label: 'Eksportér rapporter', description: 'Download rapporter', category: 'Rapporter' },
  { id: '10', key: 'reports.approve', label: 'Godkend rapporter', description: 'Godkende og afslutte rapporter', category: 'Rapporter' },
  
  // Indstillinger
  { id: '11', key: 'settings.view', label: 'Se indstillinger', description: 'Se virksomhedsindstillinger', category: 'Indstillinger' },
  { id: '12', key: 'settings.edit', label: 'Rediger indstillinger', description: 'Ændre virksomhedsindstillinger', category: 'Indstillinger' },
  { id: '13', key: 'settings.manage_roles', label: 'Administrer roller', description: 'Opret og rediger roller', category: 'Indstillinger' },
];

const CorporateRoleManagement = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading } = useAdminAuth();
  const { corporateAccount, isLoading: dataLoading } = useCorporateFleet();
  
  const [roles, setRoles] = useState<CorporateRole[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CorporateRole | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (!isLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, isLoading, navigate]);

  useEffect(() => {
    if (corporateAccount?.id) {
      fetchRoles();
    }
  }, [corporateAccount?.id]);

  const fetchRoles = async () => {
    try {
      setIsLoadingRoles(true);
      const { data, error } = await supabase
        .from('corporate_roles')
        .select('*')
        .eq('corporate_account_id', corporateAccount?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('Fejl ved hentning af roller:', err);
      toast.error('Kunne ikke hente roller');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const handleSaveRole = async () => {
    if (!formData.name || !corporateAccount?.id) {
      toast.error('Udfyld alle felter');
      return;
    }

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('corporate_roles')
          .update({
            name: formData.name,
            description: formData.description,
            permissions: selectedPermissions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success('Rolle opdateret');
      } else {
        const { data, error } = await (supabase
          .from('corporate_roles' as any) as any)
          .insert({
            corporate_account_id: corporateAccount.id,
            name: formData.name,
            description: formData.description,
            permissions: selectedPermissions,
            is_system: false,
          });

        if (error) throw error;
        toast.success('Rolle oprettet');
      }

      setIsOpen(false);
      setFormData({ name: '', description: '' });
      setSelectedPermissions([]);
      setEditingRole(null);
      fetchRoles();
    } catch (err) {
      console.error('Fejl ved gemning af rolle:', err);
      toast.error('Kunne ikke gemme rolle');
    }
  };

  const handleEditRole = (role: CorporateRole) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description });
    setSelectedPermissions(role.permissions);
    setIsOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Er du sikker på, at du vil slette denne rolle?')) return;

    try {
      const { error } = await supabase
        .from('corporate_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;
      toast.success('Rolle slettet');
      fetchRoles();
    } catch (err) {
      console.error('Fejl ved sletning af rolle:', err);
      toast.error('Kunne ikke slette rolle');
    }
  };

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Rolle & Rettigheder</h1>
            <p className="text-muted-foreground">Administrer brugerroller og tilladelser</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingRole(null);
                  setFormData({ name: '', description: '' });
                  setSelectedPermissions([]);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ny rolle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingRole ? 'Rediger rolle' : 'Opret ny rolle'}</DialogTitle>
                <DialogDescription>
                  {editingRole ? 'Opdater rolleoplysninger og rettigheder' : 'Definer en ny rolle med specifikke rettigheder'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="role-name">Rollenavn</Label>
                  <Input
                    id="role-name"
                    placeholder="f.eks. Ledelse, Revisor"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="role-description">Beskrivelse</Label>
                  <Input
                    id="role-description"
                    placeholder="Beskrivelse af rollens formål"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tilladelser</Label>
                  <div className="space-y-4 mt-3 max-h-96 overflow-y-auto p-3 border rounded-lg">
                    {Object.entries(groupedPermissions).map(([category, permissions]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="font-semibold text-sm">{category}</h4>
                        <div className="space-y-2 ml-4">
                          {permissions.map((perm) => (
                            <div key={perm.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={perm.id}
                                checked={selectedPermissions.includes(perm.key)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedPermissions([...selectedPermissions, perm.key]);
                                  } else {
                                    setSelectedPermissions(selectedPermissions.filter((p) => p !== perm.key));
                                  }
                                }}
                              />
                              <Label htmlFor={perm.id} className="cursor-pointer">
                                <div>
                                  <p className="text-sm font-medium">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground">{perm.description}</p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveRole} className="w-full">
                  {editingRole ? 'Gem ændringer' : 'Opret rolle'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingRoles ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {roles.map((role) => (
              <Card key={role.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {role.name}
                          {role.is_system && <Badge variant="outline">System</Badge>}
                        </CardTitle>
                        <CardDescription>{role.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!role.is_system && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-2">Tilladelser ({role.permissions.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {role.permissions.map((perm) => {
                          const permission = AVAILABLE_PERMISSIONS.find((p) => p.key === perm);
                          return (
                            <Badge key={perm} variant="secondary">
                              {permission?.label || perm}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {roles.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Ingen roller oprettet endnu. Opret din første rolle!
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateRoleManagement;
