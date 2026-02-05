import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Loader2, MoreHorizontal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
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

const AdminCorporateAccounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<CorporateAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('corporate_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Kunne ikke hente virksomhedskonti');
      console.error(error);
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (accountId: string, status: string) => {
    const { error } = await supabase
      .from('corporate_accounts')
      .update({ status })
      .eq('id', accountId);

    if (error) {
      toast.error('Kunne ikke opdatere status');
      return;
    }

    toast.success('Status opdateret');
    fetchAccounts();
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

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Virksomhedskonti
            </CardTitle>
            <CardDescription>Administrer corporate fleet-kunder</CardDescription>
          </div>
          <Button size="sm" onClick={() => navigate('/admin/corporate/add')}>
            <Plus className="w-4 h-4 mr-2" />
            Opret virksomhed
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen virksomhedskonti endnu</p>
            <p className="text-sm">Opret den første virksomhedskonto for at komme i gang</p>
            <Button className="mt-4" onClick={() => navigate('/admin/corporate/add')}>
              <Plus className="w-4 h-4 mr-2" />
              Opret virksomhed
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Virksomhed</TableHead>
                  <TableHead className="hidden sm:table-cell">CVR</TableHead>
                  <TableHead className="hidden md:table-cell">Kontaktperson</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Oprettet</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{account.company_name}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">CVR: {account.cvr_number}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{account.cvr_number}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>
                        <p>{account.contact_name}</p>
                        <p className="text-xs text-muted-foreground">{account.contact_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(account.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {account.created_at && format(new Date(account.created_at), 'dd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/corporate/${account.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Se detaljer
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(account.id, 'active')}>
                            Aktiver
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(account.id, 'suspended')}>
                            Suspender
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(account.id, 'terminated')}>
                            Opsig
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminCorporateAccounts;
