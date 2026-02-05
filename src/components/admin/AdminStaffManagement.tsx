import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Shield, ShieldCheck, Eye, UserPlus, MoreHorizontal, Trash2, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

type AppRole = 'support' | 'admin' | 'super_admin';

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: AppRole;
  created_at: string;
}

const roleLabels: Record<AppRole, string> = {
  support: 'Support',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const roleIcons: Record<AppRole, React.ReactNode> = {
  support: <Eye className="w-4 h-4" />,
  admin: <Shield className="w-4 h-4" />,
  super_admin: <ShieldCheck className="w-4 h-4" />,
};

const roleBadgeVariants: Record<AppRole, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  support: 'outline',
  admin: 'secondary',
  super_admin: 'default',
};

export const AdminStaffManagement = () => {
  const navigate = useNavigate();
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await (supabase.rpc)('get_admin_users');
      
      if (error) {
        console.error('Error fetching admin users:', error);
        toast.error('Kunne ikke hente medarbejdere');
        return;
      }
      
      setAdminUsers((data as AdminUser[]) || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    if (role === 'super_admin') {
      toast.error('Super Admin rolle kan ikke fjernes herfra');
      return;
    }
    
    setIsRemoving(true);
    
    try {
      const { error } = await (supabase.rpc)('remove_role', {
        _target_user_id: userId,
        _role: role,
      });
      
      if (error) {
        console.error('Error removing role:', error);
        toast.error('Kunne ikke fjerne rolle: ' + error.message);
        return;
      }
      
      toast.success('Rolle fjernet');
      fetchAdminUsers();
    } catch (err: unknown) {
      console.error('Error:', err);
      toast.error('Kunne ikke fjerne rolle');
    } finally {
      setIsRemoving(false);
    }
  };

  const filteredAdminUsers = adminUsers.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (user.email?.toLowerCase().includes(searchLower) || false) ||
      (user.full_name?.toLowerCase().includes(searchLower) || false) ||
      roleLabels[user.role].toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: adminUsers.length,
    superAdmins: adminUsers.filter(u => u.role === 'super_admin').length,
    admins: adminUsers.filter(u => u.role === 'admin').length,
    support: adminUsers.filter(u => u.role === 'support').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Medarbejdere</h2>
          <p className="text-muted-foreground">Administrer roller og adgange for dit team</p>
        </div>
        <Button onClick={() => navigate('/admin/staff/add')}>
          <UserPlus className="w-4 h-4 mr-2" />
          Tilføj medarbejder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-600" />
              <span className="text-2xl font-bold">{stats.superAdmins}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats.admins}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <span className="text-2xl font-bold">{stats.support}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Søg efter navn, email eller rolle..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rolle</TableHead>
                <TableHead>Tilføjet</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Indlæser...
                  </TableCell>
                </TableRow>
              ) : filteredAdminUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Ingen medarbejdere fundet
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdminUsers.map((user) => (
                  <TableRow key={`${user.user_id}-${user.role}`}>
                    <TableCell className="font-medium">
                      {user.full_name || 'Unavngivet'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.email || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariants[user.role]} className="gap-1">
                        {roleIcons[user.role]}
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(user.created_at), 'd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      {user.role !== 'super_admin' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleRemoveRole(user.user_id, user.role)}
                              className="text-destructive"
                              disabled={isRemoving}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Fjern rolle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Roller og adgange</CardTitle>
          <CardDescription>Oversigt over hvad de forskellige roller har adgang til</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <span className="font-semibold">Support</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Se bookinger og brugere</li>
                <li>• Læse beskeder og chat</li>
                <li>• Se statistik</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-semibold">Admin</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alt fra Support</li>
                <li>• Oprette og redigere data</li>
                <li>• Håndtere advarsler</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Super Admin</span>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Alt fra Admin</li>
                <li>• Tildele og fjerne roller</li>
                <li>• Slette brugere</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStaffManagement;
