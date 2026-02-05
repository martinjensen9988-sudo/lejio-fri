import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, Search, MoreHorizontal, CheckCircle, XCircle, 
  Pause, Ban, Edit, Eye, Loader2, AlertTriangle, Building2, Mail, Send, Trash2
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  user_type: string;
  subscription_status: string;
  subscription_tier: string | null;
  fleet_plan: string | null;
  account_status: string;
  account_paused_at: string | null;
  account_paused_reason: string | null;
  account_banned_at: string | null;
  account_banned_reason: string | null;
  manual_activation: boolean;
  created_at: string;
  trial_ends_at: string | null;
}

const ACCOUNT_STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  paused: 'Sat på pause',
  banned: 'Udelukket',
};

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'pause' | 'ban' | 'activate' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Email dialog state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailForm, setEmailForm] = useState({
    subject: '',
    message: '',
  });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  // Edit form state
  const [editForm, setEditForm] = useState({
    subscription_status: '',
    subscription_tier: '',
    fleet_plan: '',
    manual_activation: false,
  });

  const fetchUsers = async () => {
    setIsLoading(true);

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout: kunne ikke hente brugere. Prøv igen.')), 12000)
    );

    try {
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        timeout,
      ]);

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Kunne ikke hente brugere');
      } else {
        setUsers(data || []);
      }
    } catch (err: unknown) {
      console.error('fetchUsers failed:', err);
      toast.error(err?.message || 'Kunne ikke hente brugere');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      subscription_status: user.subscription_status,
      subscription_tier: user.subscription_tier || 'free',
      fleet_plan: user.fleet_plan || '',
      manual_activation: user.manual_activation,
    });
    setShowEditDialog(true);
  };

  const handleOpenAction = (user: UserProfile, type: 'pause' | 'ban' | 'activate') => {
    setSelectedUser(user);
    setActionType(type);
    setActionReason('');
    setShowActionDialog(true);
  };

  const handleOpenEmail = (user: UserProfile) => {
    setSelectedUser(user);
    setEmailForm({ subject: '', message: '' });
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!selectedUser || !emailForm.subject.trim() || !emailForm.message.trim()) return;
    setIsSendingEmail(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('send-admin-email', {
        body: {
          recipientEmail: selectedUser.email,
          recipientName: selectedUser.full_name || selectedUser.company_name || 'Bruger',
          subject: emailForm.subject,
          message: emailForm.message,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast.success(`Email sendt til ${selectedUser.email}`);
      setShowEmailDialog(false);
    } catch (error: unknown) {
      console.error('Error sending email:', error);
      toast.error('Kunne ikke sende email: ' + (error.message || 'Ukendt fejl'));
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);

    const updateData: unknown = {
      subscription_status: editForm.subscription_status,
      subscription_tier: editForm.subscription_tier,
      manual_activation: editForm.manual_activation,
    };

    if (editForm.fleet_plan && editForm.fleet_plan !== 'none') {
      updateData.fleet_plan = editForm.fleet_plan;
    } else {
      updateData.fleet_plan = null;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Kunne ikke opdatere bruger');
    } else {
      toast.success('Bruger opdateret');
      setShowEditDialog(false);
      fetchUsers();
    }
    setIsUpdating(false);
  };

  const handleExecuteAction = async () => {
    if (!selectedUser || !actionType) return;
    setIsUpdating(true);

    let updateData: unknown = {};

    switch (actionType) {
      case 'pause':
        updateData = {
          account_status: 'paused',
          account_paused_at: new Date().toISOString(),
          account_paused_reason: actionReason,
        };
        break;
      case 'ban':
        updateData = {
          account_status: 'banned',
          account_banned_at: new Date().toISOString(),
          account_banned_reason: actionReason,
        };
        break;
      case 'activate':
        updateData = {
          account_status: 'active',
          account_paused_at: null,
          account_paused_reason: null,
          account_banned_at: null,
          account_banned_reason: null,
        };
        break;
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', selectedUser.id);

    if (error) {
      toast.error('Kunne ikke opdatere bruger');
    } else {
      const messages = {
        pause: 'Bruger sat på pause',
        ban: 'Bruger udelukket',
        activate: 'Bruger aktiveret',
      };
      toast.success(messages[actionType]);
      setShowActionDialog(false);
      fetchUsers();
    }
    setIsUpdating(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setIsDeleting(true);

    try {
      // Call edge function to fully delete user (auth + profile + vehicles)
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userId: selectedUser.id },
      });

      if (error) {
        console.error('Error deleting user:', error);
        toast.error('Kunne ikke slette bruger: ' + error.message);
      } else if (data?.error) {
        console.error('Error deleting user:', data.error);
        toast.error('Kunne ikke slette bruger: ' + data.error);
      } else {
        toast.success('Bruger og alle tilknyttede data slettet permanent');
        setShowDeleteDialog(false);
        setSelectedUser(null);
        // Remove user from local state immediately
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      }
    } catch (error: unknown) {
      console.error('Error deleting user:', error);
      toast.error('Kunne ikke slette bruger');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenDelete = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const getAccountStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-accent text-accent-foreground',
      paused: 'bg-yellow-500',
      banned: 'bg-destructive',
    };
    return <Badge className={colors[status] || 'bg-secondary'}>{ACCOUNT_STATUS_LABELS[status] || status}</Badge>;
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: users.length,
    active: users.filter(u => u.account_status === 'active').length,
    paused: users.filter(u => u.account_status === 'paused').length,
    banned: users.filter(u => u.account_status === 'banned').length,
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Brugere i alt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Aktive</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Pause className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.paused}</p>
                <p className="text-xs text-muted-foreground">På pause</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ban className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{stats.banned}</p>
                <p className="text-xs text-muted-foreground">Udelukkede</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Brugerstyring</CardTitle>
              <CardDescription>Administrer alle brugere, planer og adgang</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Søg brugere..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bruger</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Konto status</TableHead>
                <TableHead>Oprettet</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {user.user_type === 'professionel' && (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{user.full_name || user.company_name || 'Ukendt'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.user_type === 'professionel' ? 'Professionel' : 'Privat'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {user.subscription_tier || 'free'}
                      </Badge>
                      {user.fleet_plan && (
                        <Badge className="bg-primary text-xs block w-fit">
                          Fleet: {user.fleet_plan === 'fleet_basic' ? 'Basic' : 'Premium'}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getAccountStatusBadge(user.account_status)}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd. MMM yyyy', { locale: da })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/users/edit/${user.id}`)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Rediger bruger
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEmail(user)}>
                          <Mail className="w-4 h-4 mr-2" />
                          Send email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.account_status === 'active' && (
                          <>
                            <DropdownMenuItem onClick={() => handleOpenAction(user, 'pause')}>
                              <Pause className="w-4 h-4 mr-2" />
                              Sæt på pause
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleOpenAction(user, 'ban')}
                              className="text-destructive"
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Udeluk bruger
                            </DropdownMenuItem>
                          </>
                        )}
                        {(user.account_status === 'paused' || user.account_status === 'banned') && (
                          <DropdownMenuItem onClick={() => handleOpenAction(user, 'activate')}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Genaktiver bruger
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleOpenDelete(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Slet bruger permanent
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rediger bruger</DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Abonnementsstatus</Label>
              <Select
                value={editForm.subscription_status}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, subscription_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Prøveperiode</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Abonnementsniveau</Label>
              <Select
                value={editForm.subscription_tier}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, subscription_tier: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="basic">Basic (299 kr)</SelectItem>
                  <SelectItem value="standard">Standard (499 kr)</SelectItem>
                  <SelectItem value="premium">Premium (799 kr)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fleet Plan</Label>
              <Select
                value={editForm.fleet_plan}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, fleet_plan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ingen fleet plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen</SelectItem>
                  <SelectItem value="fleet_basic">Fleet Basic</SelectItem>
                  <SelectItem value="fleet_premium">Fleet Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gem ændringer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'pause' && 'Sæt bruger på pause'}
              {actionType === 'ban' && 'Udeluk bruger'}
              {actionType === 'activate' && 'Genaktiver bruger'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          {actionType !== 'activate' && (
            <div className="space-y-2">
              <Label>Begrundelse</Label>
              <Textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Angiv årsag til handling..."
              />
            </div>
          )}
          {actionType === 'ban' && (
            <div className="bg-destructive/10 p-4 rounded-lg">
              <p className="text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Udelukkede brugere kan ikke logge ind eller bruge platformen.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActionDialog(false)}>
              Annuller
            </Button>
            <Button 
              variant={actionType === 'ban' ? 'destructive' : 'default'}
              onClick={handleExecuteAction} 
              disabled={isUpdating || (actionType !== 'activate' && !actionReason.trim())}
            >
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === 'pause' && 'Sæt på pause'}
              {actionType === 'ban' && 'Udeluk'}
              {actionType === 'activate' && 'Genaktiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send email til bruger
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || selectedUser?.company_name || 'Bruger'} ({selectedUser?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emne</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Skriv emailens emne..."
              />
            </div>
            <div className="space-y-2">
              <Label>Besked</Label>
              <Textarea
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Skriv din besked her..."
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Annuller
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={isSendingEmail || !emailForm.subject.trim() || !emailForm.message.trim()}
            >
              {isSendingEmail ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Slet bruger permanent
            </AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på, at du vil slette <strong>{selectedUser?.full_name || selectedUser?.company_name || selectedUser?.email}</strong> permanent?
              <br /><br />
              <span className="text-destructive font-medium">
                Denne handling kan ikke fortrydes. Alle brugerens data vil blive slettet.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Slet permanent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminUserManagement;
