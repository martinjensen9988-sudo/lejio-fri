import { useState, useEffect } from 'react';
import { Loader2, Receipt, CheckCircle, XCircle, Search, Mail, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

interface PlatformFee {
  id: string;
  lessor_id: string;
  booking_id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  paid_at: string | null;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
    company_name: string | null;
  } | null;
}

const AdminPlatformFees = () => {
  const [fees, setFees] = useState<PlatformFee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    setLoading(true);
    
    // First fetch fees
    const { data: feesData, error: feesError } = await supabase
      .from('platform_fees')
      .select('*')
      .order('created_at', { ascending: false });

    if (feesError) {
      console.error('Error fetching fees:', feesError);
      setLoading(false);
      return;
    }

    // Then fetch profiles for each unique lessor
    const lessorIds = [...new Set(feesData?.map(f => f.lessor_id) || [])];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .in('id', lessorIds);

    // Combine data
    const feesWithProfiles = (feesData || []).map(fee => ({
      ...fee,
      profiles: profilesData?.find(p => p.id === fee.lessor_id) || null
    }));

    setFees(feesWithProfiles);
    setLoading(false);
  };

  const handleMarkAsPaid = async (feeId: string) => {
    const { error } = await supabase
      .from('platform_fees')
      .update({ 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', feeId);

    if (error) {
      toast.error('Kunne ikke opdatere gebyr');
      return;
    }

    toast.success('Gebyr markeret som betalt');
    fetchFees();
  };

  const handleWaiveFee = async (feeId: string) => {
    const { error } = await supabase
      .from('platform_fees')
      .update({ status: 'waived' })
      .eq('id', feeId);

    if (error) {
      toast.error('Kunne ikke frafalde gebyr');
      return;
    }

    toast.success('Gebyr frafaldet');
    fetchFees();
  };

  const [sendingReminders, setSendingReminders] = useState(false);

  const handleSendReminders = async () => {
    setSendingReminders(true);
    try {
      // Get current session for JWT authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Du skal være logget ind for at sende påmindelser');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-payment-reminder`,
        {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ sendToAll: true }),
        }
      );
      
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        toast.error('Du har ikke tilladelse til at sende påmindelser');
        return;
      }
      
      if (data.success) {
        toast.success(`Påmindelser sendt til ${data.emailsSent} udlejere`);
      } else {
        toast.error(data.error || 'Kunne ikke sende påmindelser');
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      toast.error('Kunne ikke sende påmindelser');
    } finally {
      setSendingReminders(false);
    }
  };

  const filteredFees = fees.filter(fee => {
    const profile = fee.profiles;
    if (!profile) return true;
    return (
      profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const stats = {
    total: fees.length,
    pending: fees.filter(f => f.status === 'pending').length,
    pendingAmount: fees.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0),
    paid: fees.filter(f => f.status === 'paid').length,
    paidAmount: fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-accent">Betalt</Badge>;
      case 'waived':
        return <Badge variant="secondary">Frafaldet</Badge>;
      default:
        return <Badge variant="outline" className="text-warm border-warm">Afventer</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-warm">{stats.pendingAmount.toLocaleString('da-DK')} kr</p>
              <p className="text-sm text-muted-foreground">{stats.pending} afventende</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-accent">{stats.paidAmount.toLocaleString('da-DK')} kr</p>
              <p className="text-sm text-muted-foreground">{stats.paid} betalte</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total gebyrer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fees Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Platform gebyrer
              </CardTitle>
              <CardDescription>49 kr per booking for private udlejere</CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Søg udlejer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {stats.pending > 0 && (
                <Button 
                  onClick={handleSendReminders}
                  disabled={sendingReminders}
                  variant="outline"
                  className="gap-2"
                >
                  {sendingReminders ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  Send påmindelser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFees.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">Ingen gebyrer endnu</h3>
              <p className="text-muted-foreground">
                Gebyrer oprettes automatisk når private udlejere modtager bookinger
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Udlejer</TableHead>
                  <TableHead>Beløb</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Oprettet</TableHead>
                  <TableHead>Betalt</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {fee.profiles?.full_name || fee.profiles?.company_name || 'Ukendt'}
                        </p>
                        <p className="text-sm text-muted-foreground">{fee.profiles?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {fee.amount.toLocaleString('da-DK')} {fee.currency}
                    </TableCell>
                    <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    <TableCell>
                      {format(new Date(fee.created_at), 'dd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      {fee.paid_at 
                        ? format(new Date(fee.paid_at), 'dd. MMM yyyy', { locale: da })
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {fee.status === 'pending' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              Handlinger
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleMarkAsPaid(fee.id)}>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Markér som betalt
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleWaiveFee(fee.id)}>
                              <XCircle className="w-4 h-4 mr-2" />
                              Frafald gebyr
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlatformFees;
