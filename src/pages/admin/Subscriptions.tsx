import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Filter, Download, CreditCard, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/api/client';
import { format, differenceInDays } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface LessorSubscription {
  id: string;
  company_name: string;
  contact_email: string;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  payment_method: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  created_at: string;
  manual_activation: boolean;
}

const AdminSubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user, hasAccess, isLoading: authLoading } = useAdminAuth();
  const [subscriptions, setSubscriptions] = useState<LessorSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [selectedLessor, setSelectedLessor] = useState<LessorSubscription | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editTier, setEditTier] = useState<string>('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || !hasAccess)) {
      navigate('/admin');
    }
  }, [user, hasAccess, authLoading, navigate]);

  useEffect(() => {
    if (user && hasAccess) {
      fetchSubscriptions();
    }
  }, [user, hasAccess]);

  const fetchSubscriptions = async () => {
    setIsLoading(true);
    try {
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'lessor');

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match LessorSubscription interface
      const transformed: LessorSubscription[] = (data || []).map(profile => ({
        id: profile.id,
        company_name: profile.company_name || profile.full_name || 'N/A',
        contact_email: profile.email,
        subscription_tier: profile.subscription_tier || 'free',
        subscription_status: profile.subscription_status || 'inactive',
        trial_ends_at: profile.trial_ends_at,
        stripe_customer_id: profile.stripe_customer_id,
        stripe_subscription_id: profile.stripe_subscription_id,
        payment_method: profile.payment_method || null,
        last_payment_date: profile.last_payment_date,
        last_payment_amount: profile.last_payment_amount,
        created_at: profile.created_at,
        manual_activation: profile.manual_activation || false,
      }));

      setSubscriptions(transformed);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Kunne ikke hente abonnementer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (lessor: LessorSubscription) => {
    setSelectedLessor(lessor);
    setEditStatus(lessor.subscription_status);
    setEditTier(lessor.subscription_tier);
    setEditDialogOpen(true);
  };

  const handleSaveChanges = async () => {
    if (!selectedLessor) return;

    setEditLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: editStatus,
          subscription_tier: editTier,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedLessor.id);

      if (error) throw error;

      toast.success('Abonnement opdateret');
      setEditDialogOpen(false);
      await fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Kunne ikke opdatere abonnement');
    } finally {
      setEditLoading(false);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch =
      sub.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.contact_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || sub.subscription_status === filterStatus;
    const matchesTier = filterTier === 'all' || sub.subscription_tier === filterTier;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.subscription_status === 'active').length,
    trial: subscriptions.filter(s => s.subscription_status === 'trial').length,
    inactive: subscriptions.filter(s => s.subscription_status === 'inactive').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-700';
      case 'trial':
        return 'bg-blue-500/10 text-blue-700';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-700';
      case 'paused':
        return 'bg-yellow-500/10 text-yellow-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getTierBadge = (tier: string) => {
    const tierConfig: Record<string, { label: string; color: string }> = {
      free: { label: 'Gratis', color: 'bg-gray-500/10 text-gray-700' },
      basic: { label: 'Basic (299 kr)', color: 'bg-blue-500/10 text-blue-700' },
      standard: { label: 'Standard (499 kr)', color: 'bg-purple-500/10 text-purple-700' },
      premium: { label: 'Premium (799 kr)', color: 'bg-amber-500/10 text-amber-700' },
      professional: { label: 'Professional', color: 'bg-emerald-500/10 text-emerald-700' },
      business: { label: 'Business', color: 'bg-violet-500/10 text-violet-700' },
      enterprise: { label: 'Enterprise', color: 'bg-pink-500/10 text-pink-700' },
    };
    const config = tierConfig[tier] || { label: tier, color: 'bg-gray-500/10 text-gray-700' };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'trial':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatPaymentMethod = (method: string | null, stripeId: string | null): string => {
    if (method === 'stripe' || stripeId) return 'Stripe / Kort';
    if (method === 'bank_transfer') return 'Bankoverførsel';
    if (method === 'invoice') return 'Faktura';
    if (method === 'mobilepay') return 'MobilePay';
    return 'Ikke angivet';
  };

  if (authLoading || isLoading) {
    return (
      <AdminDashboardLayout activeTab="subscriptions">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="subscriptions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">Abonnementer</h2>
            <p className="text-muted-foreground">Oversigt over alle lessor-abonnementer og betalinger</p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Eksportér
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Lessors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrerede brugere</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Aktive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
              <p className="text-xs text-muted-foreground mt-1">Betaler abonnement</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Prøveperiode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.trial}</div>
              <p className="text-xs text-muted-foreground mt-1">Under evaluering</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                Inaktive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inactive}</div>
              <p className="text-xs text-muted-foreground mt-1">Ikke aktive</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Søg efter virksomhed eller email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statusser</SelectItem>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="trial">Prøveperiode</SelectItem>
                  <SelectItem value="paused">Sat på pause</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue placeholder="Abonnementsniveau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle niveauer</SelectItem>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Viser {filteredSubscriptions.length} af {subscriptions.length} abonnementer
            </p>
          </CardContent>
        </Card>

        {/* Subscriptions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Abonnementer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Virksomhed</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Niveau</TableHead>
                    <TableHead className="font-semibold">Betalingsmetode</TableHead>
                    <TableHead className="font-semibold">Sidste betaling</TableHead>
                    <TableHead className="font-semibold">Prøveperiode slutter</TableHead>
                    <TableHead className="font-semibold">Handling</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.length > 0 ? (
                    filteredSubscriptions.map((sub) => (
                      <TableRow key={sub.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-medium">{sub.company_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{sub.contact_email}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(sub.subscription_status)}
                            <Badge className={getStatusColor(sub.subscription_status)}>
                              {sub.subscription_status === 'active' ? 'Aktiv' : 
                               sub.subscription_status === 'trial' ? 'Prøveperiode' :
                               sub.subscription_status === 'paused' ? 'Pause' : 'Inaktiv'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{getTierBadge(sub.subscription_tier)}</TableCell>
                        <TableCell className="text-sm">
                          {formatPaymentMethod(sub.payment_method, sub.stripe_customer_id)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.last_payment_date ? (
                            <div>
                              <div className="font-medium">
                                {format(new Date(sub.last_payment_date), 'd. MMM yyyy', { locale: da })}
                              </div>
                              <div className="text-muted-foreground">
                                {sub.last_payment_amount ? `${sub.last_payment_amount.toLocaleString('da-DK')} kr` : 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Ingen betaling</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sub.trial_ends_at ? (
                            <div>
                              <div className="font-medium">
                                {format(new Date(sub.trial_ends_at), 'd. MMM yyyy', { locale: da })}
                              </div>
                              <div className={`text-xs font-medium ${
                                differenceInDays(new Date(sub.trial_ends_at), new Date()) < 3
                                  ? 'text-red-600'
                                  : 'text-muted-foreground'
                              }`}>
                                {differenceInDays(new Date(sub.trial_ends_at), new Date())} dage
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Dialog open={editDialogOpen && selectedLessor?.id === sub.id} onOpenChange={(open) => {
                            if (!open) setEditDialogOpen(false);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditClick(sub)}
                              >
                                Rediger
                              </Button>
                            </DialogTrigger>
                            {selectedLessor?.id === sub.id && (
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Rediger abonnement</DialogTitle>
                                  <DialogDescription>
                                    {selectedLessor?.company_name} ({selectedLessor?.contact_email})
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Status</label>
                                    <Select value={editStatus} onValueChange={setEditStatus}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="active">Aktiv</SelectItem>
                                        <SelectItem value="trial">Prøveperiode</SelectItem>
                                        <SelectItem value="paused">Pause</SelectItem>
                                        <SelectItem value="inactive">Inaktiv</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Abonnementsniveau</label>
                                    <Select value={editTier} onValueChange={setEditTier}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="free">Gratis</SelectItem>
                                        <SelectItem value="basic">Basic (299 kr)</SelectItem>
                                        <SelectItem value="standard">Standard (499 kr)</SelectItem>
                                        <SelectItem value="premium">Premium (799 kr)</SelectItem>
                                        <SelectItem value="professional">Professional</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex gap-2 pt-4">
                                    <Button
                                      onClick={handleSaveChanges}
                                      disabled={editLoading}
                                      className="flex-1"
                                    >
                                      {editLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                      Gem ændringer
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setEditDialogOpen(false)}
                                      className="flex-1"
                                    >
                                      Annuller
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">Ingen abonnementer fundet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default AdminSubscriptionsPage;
