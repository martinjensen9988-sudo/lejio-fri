import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, UserPlus, Eye, Shield } from 'lucide-react';

type AppRole = 'support' | 'admin' | 'super_admin';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
}

const roleDescriptions: Record<AppRole, string> = {
  support: 'Kan se data og hjælpe brugere',
  admin: 'Kan redigere data og administrere',
  super_admin: 'Fuld adgang til alt',
};

const StaffAddPage = () => {
  const navigate = useNavigate();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<AppRole>('support');
  const [isAdding, setIsAdding] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('full_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching users:', error);
        return;
      }
      
      setAllUsers(data || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const filteredUserOptions = allUsers.filter(user => {
    const searchLower = userSearchQuery.toLowerCase();
    return (
      (user.email?.toLowerCase().includes(searchLower) || false) ||
      (user.full_name?.toLowerCase().includes(searchLower) || false)
    );
  });

  const handleAssignRole = async () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Vælg en bruger og en rolle');
      return;
    }
    
    setIsAdding(true);
    
    try {
      const { error } = await (supabase.rpc)('assign_role', {
        _target_user_id: selectedUserId,
        _role: selectedRole,
      });
      
      if (error) {
        console.error('Error assigning role:', error);
        if (error.message?.includes('super_admin') || error.message?.includes('Only super admins')) {
          toast.error('Kun Super Admins kan tildele roller. Kontakt en Super Admin.');
        } else {
          toast.error('Kunne ikke tildele rolle: ' + error.message);
        }
        return;
      }
      
      toast.success(`Rolle tildelt!`);
      navigate('/admin/staff');
    } catch (err: unknown) {
      console.error('Error:', err);
      if (err?.message?.includes('super_admin') || err?.message?.includes('Only super admins')) {
        toast.error('Kun Super Admins kan tildele roller. Kontakt en Super Admin.');
      } else {
        toast.error('Kunne ikke tildele rolle: ' + (err?.message || 'Ukendt fejl'));
      }
    } finally {
      setIsAdding(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    navigate('/admin');
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="staff">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/staff')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Tilføj medarbejder</h2>
            <p className="text-muted-foreground">Tildel en bruger admin-adgang</p>
          </div>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Medarbejder detaljer
            </CardTitle>
            <CardDescription>
              Tildel en bruger en admin-rolle for at give dem adgang til admin-panelet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Søg bruger</Label>
              <Input
                placeholder="Søg efter navn eller email..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vælg bruger *</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg en bruger" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUserOptions.slice(0, 20).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email || 'Unavngivet'}
                      {user.email && user.full_name && (
                        <span className="text-muted-foreground ml-2">({user.email})</span>
                      )}
                    </SelectItem>
                  ))}
                  {filteredUserOptions.length === 0 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Ingen brugere fundet
                    </div>
                  )}
                  {filteredUserOptions.length > 20 && (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Vis flere ved at søge mere specifikt
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Rolle *</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <div>
                        <div>Support</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.support}</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      <div>
                        <div>Admin</div>
                        <div className="text-xs text-muted-foreground">{roleDescriptions.admin}</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Super Admin rollen kan kun tildeles direkte i databasen af sikkerhedshensyn.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/admin/staff')}>
                Annuller
              </Button>
              <Button className="flex-1" onClick={handleAssignRole} disabled={isAdding || !selectedUserId}>
                {isAdding ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                Tilføj medarbejder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default StaffAddPage;
