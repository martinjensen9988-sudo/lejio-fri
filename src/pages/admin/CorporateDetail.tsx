import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Building2, Users, Car, FileText, Mail, Phone, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface CorporateAccount {
  id: string;
  company_name: string;
  cvr_number: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  ean_number: string | null;
  billing_address: string | null;
  billing_city: string | null;
  billing_postal_code: string | null;
  monthly_budget: number | null;
  commission_rate: number | null;
  status: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  notes: string | null;
  created_at: string | null;
}

interface CorporateStats {
  total_employees: number;
  total_fleet_vehicles: number;
  total_bookings: number;
  total_invoices: number;
}

const CorporateDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { hasAccess, isLoading: authLoading } = useAdminAuth();
  const [account, setAccount] = useState<CorporateAccount | null>(null);
  const [stats, setStats] = useState<CorporateStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchAccount();
    }
  }, [id]);

  const fetchAccount = async () => {
    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      toast.error('Kunne ikke hente virksomhed');
      navigate('/admin/corporate');
      return;
    }

    setAccount(data);
    await fetchStats(data.id);
    setLoading(false);
  };

  const fetchStats = async (accountId: string) => {
    const [employees, vehicles, bookings, invoices] = await Promise.all([
      supabase.from('corporate_employees').select('id', { count: 'exact' }).eq('corporate_account_id', accountId),
      supabase.from('corporate_fleet_vehicles').select('id', { count: 'exact' }).eq('corporate_account_id', accountId),
      supabase.from('corporate_bookings').select('id', { count: 'exact' }).eq('corporate_account_id', accountId),
      supabase.from('corporate_invoices').select('id', { count: 'exact' }).eq('corporate_account_id', accountId),
    ]);

    setStats({
      total_employees: employees.count || 0,
      total_fleet_vehicles: vehicles.count || 0,
      total_bookings: bookings.count || 0,
      total_invoices: invoices.count || 0,
    });
  };

  const handleUpdateStatus = async (status: string) => {
    if (!account) return;
    
    const { error } = await supabase
      .from('corporate_accounts')
      .update({ status })
      .eq('id', account.id);

    if (error) {
      toast.error('Kunne ikke opdatere status');
      return;
    }

    toast.success('Status opdateret');
    fetchAccount();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-accent">Aktiv</Badge>;
      case 'pending':
        return <Badge variant="secondary">Afventer</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspenderet</Badge>;
      case 'terminated':
        return <Badge variant="outline">Opsagt</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
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

  if (!account) {
    return null;
  }

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/corporate')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbage
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{account.company_name}</h2>
            <p className="text-muted-foreground">CVR: {account.cvr_number}</p>
          </div>
          {getStatusBadge(account.status)}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_employees || 0}</p>
                <p className="text-xs text-muted-foreground">Medarbejdere</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-accent" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_fleet_vehicles || 0}</p>
                <p className="text-xs text-muted-foreground">Køretøjer</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-secondary" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_bookings || 0}</p>
                <p className="text-xs text-muted-foreground">Bookinger</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats?.total_invoices || 0}</p>
                <p className="text-xs text-muted-foreground">Fakturaer</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kontaktoplysninger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{account.contact_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <a href={`mailto:${account.contact_email}`} className="text-primary hover:underline">
                  {account.contact_email}
                </a>
              </div>
              {account.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${account.contact_phone}`} className="text-primary hover:underline">
                    {account.contact_phone}
                  </a>
                </div>
              )}
              {(account.billing_address || account.billing_city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                  <div>
                    {account.billing_address && <p>{account.billing_address}</p>}
                    {(account.billing_postal_code || account.billing_city) && (
                      <p>{account.billing_postal_code} {account.billing_city}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle>Kontraktoplysninger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {account.ean_number && (
                <div>
                  <p className="text-sm text-muted-foreground">EAN-nummer</p>
                  <p className="font-mono">{account.ean_number}</p>
                </div>
              )}
              {account.monthly_budget && (
                <div>
                  <p className="text-sm text-muted-foreground">Månedligt budget</p>
                  <p className="font-semibold">{account.monthly_budget.toLocaleString('da-DK')} DKK</p>
                </div>
              )}
              {account.commission_rate && (
                <div>
                  <p className="text-sm text-muted-foreground">Kommissionsrate</p>
                  <p className="font-semibold">{account.commission_rate}%</p>
                </div>
              )}
              {account.contract_start_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Kontraktstart</p>
                  <p>{format(new Date(account.contract_start_date), 'd. MMMM yyyy', { locale: da })}</p>
                </div>
              )}
              {account.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Noter</p>
                  <p className="whitespace-pre-wrap">{account.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Handlinger</CardTitle>
            <CardDescription>Administrer virksomhedens status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => handleUpdateStatus('active')}>
                Aktiver
              </Button>
              <Button variant="outline" onClick={() => handleUpdateStatus('suspended')}>
                Suspender
              </Button>
              <Button variant="destructive" onClick={() => handleUpdateStatus('terminated')}>
                Opsig
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminDashboardLayout>
  );
};

export default CorporateDetailPage;
