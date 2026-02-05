import { useState, useEffect } from 'react';
import { useInvoices } from '@/hooks/useInvoices';
import { useAuth } from '@/hooks/useAuth';
import { useDunningManagement } from '@/hooks/useDunningManagement';
import { useSubscriptionBilling } from '@/hooks/useSubscriptionBilling';
import { supabase } from '@/integrations/azure/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PaymentReminder } from '@/components/invoices/PaymentReminder';
import { SubscriptionManager } from '@/components/invoices/SubscriptionManager';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Plus,
  Car,
  Bell,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { toast } from 'sonner';

interface BookingForInvoice {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  renter_email: string;
  renter_name: string | null;
  status: string;
  vehicles: {
    make: string;
    model: string;
    registration: string;
  } | null;
}

const InvoicesTab = () => {
  const { user } = useAuth();
  const { 
    invoices, 
    isLoading, 
    markAsPaid, 
    cancelInvoice,
    generateInvoice,
    getUnpaidInvoices,
    getPaidInvoices,
    getOverdueInvoices
  } = useInvoices();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bookingsWithoutInvoice, setBookingsWithoutInvoice] = useState<BookingForInvoice[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Fetch bookings that don't have invoices yet
  useEffect(() => {
    const fetchBookingsWithoutInvoice = async () => {
      if (!user) return;
      
      try {
        // Get all booking IDs that already have invoices
        const { data: existingInvoices } = await supabase
          .from('invoices')
          .select('booking_id')
          .eq('lessor_id', user.id);
        
        const invoicedBookingIds = existingInvoices?.map(i => i.booking_id).filter(Boolean) || [];
        
        // Get completed/confirmed bookings without invoices
        let query = supabase
          .from('bookings')
          .select(`
            id,
            start_date,
            end_date,
            total_price,
            renter_email,
            renter_name,
            status,
            vehicles:vehicle_id (
              make,
              model,
              registration
            )
          `)
          .eq('lessor_id', user.id)
          .in('status', ['completed', 'confirmed'])
          .order('end_date', { ascending: false });
        
        if (invoicedBookingIds.length > 0) {
          query = query.not('id', 'in', `(${invoicedBookingIds.join(',')})`);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setBookingsWithoutInvoice(data as BookingForInvoice[] || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoadingBookings(false);
      }
    };

    fetchBookingsWithoutInvoice();
  }, [user, invoices]);

  const handleCreateInvoice = async () => {
    if (!selectedBookingId) {
      toast.error('Vælg en booking');
      return;
    }
    
    setCreatingInvoice(true);
    try {
      const result = await generateInvoice(selectedBookingId, true);
      if (result) {
        setCreateDialogOpen(false);
        setSelectedBookingId('');
        // Remove from available bookings
        setBookingsWithoutInvoice(prev => prev.filter(b => b.id !== selectedBookingId));
      }
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    setActionLoading(id);
    const success = await markAsPaid(id);
    if (success) {
      toast.success('Faktura markeret som betalt');
    }
    setActionLoading(null);
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    const success = await cancelInvoice(id);
    if (success) {
      toast.success('Faktura annulleret');
    }
    setActionLoading(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">Betalt</Badge>;
      case 'issued':
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">Afventer</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30">Forfalden</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground">Annulleret</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const unpaidInvoices = getUnpaidInvoices();
  const paidInvoices = getPaidInvoices();
  const overdueInvoices = getOverdueInvoices();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const InvoiceTable = ({ invoiceList, showActions = true }: { invoiceList: typeof invoices, showActions?: boolean }) => (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Fakturanr.</TableHead>
            <TableHead>Lejer</TableHead>
            <TableHead>Beløb</TableHead>
            <TableHead>Forfaldsdato</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead className="text-right">Handlinger</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoiceList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground">
                Ingen fakturaer at vise
              </TableCell>
            </TableRow>
          ) : (
            invoiceList.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{invoice.renter_name || 'Ukendt'}</p>
                    <p className="text-sm text-muted-foreground">{invoice.renter_email}</p>
                  </div>
                </TableCell>
                <TableCell className="font-semibold">
                  {invoice.total_amount.toLocaleString('da-DK')} {invoice.currency}
                </TableCell>
                <TableCell>
                  {invoice.due_date 
                    ? format(new Date(invoice.due_date), 'dd. MMM yyyy', { locale: da })
                    : '-'
                  }
                </TableCell>
                <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.pdf_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(invoice.pdf_url!, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {invoice.status === 'issued' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsPaid(invoice.id)}
                            disabled={actionLoading === invoice.id}
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(invoice.id)}
                            disabled={actionLoading === invoice.id}
                          >
                            <XCircle className="w-4 h-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Dine fakturaer</h3>
          <p className="text-sm text-muted-foreground">
            Opret og administrer fakturaer for dine bookinger
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={bookingsWithoutInvoice.length === 0}>
              <Plus className="w-4 h-4 mr-2" />
              Opret faktura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Opret faktura fra booking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              {loadingBookings ? (
                <Skeleton className="h-10 w-full" />
              ) : bookingsWithoutInvoice.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Ingen bookinger uden faktura
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Vælg booking</label>
                    <Select value={selectedBookingId} onValueChange={setSelectedBookingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vælg en booking..." />
                      </SelectTrigger>
                      <SelectContent>
                        {bookingsWithoutInvoice.map((booking) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            <div className="flex items-center gap-2">
                              <Car className="w-4 h-4" />
                              <span>
                                {booking.vehicles?.make} {booking.vehicles?.model} - {booking.renter_name || booking.renter_email}
                              </span>
                              <span className="text-muted-foreground">
                                ({booking.total_price.toLocaleString('da-DK')} kr)
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedBookingId && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4">
                        {(() => {
                          const booking = bookingsWithoutInvoice.find(b => b.id === selectedBookingId);
                          if (!booking) return null;
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Køretøj:</span>
                                <span>{booking.vehicles?.make} {booking.vehicles?.model} ({booking.vehicles?.registration})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Periode:</span>
                                <span>
                                  {format(new Date(booking.start_date), 'dd. MMM', { locale: da })} - {format(new Date(booking.end_date), 'dd. MMM yyyy', { locale: da })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Lejer:</span>
                                <span>{booking.renter_name || booking.renter_email}</span>
                              </div>
                              <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Beløb (ekskl. moms):</span>
                                <span>{booking.total_price.toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>Moms (25%):</span>
                                <span>{(booking.total_price * 0.25).toLocaleString('da-DK')} kr</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>{(booking.total_price * 1.25).toLocaleString('da-DK')} kr</span>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  )}
                  
                  <Button 
                    className="w-full" 
                    onClick={handleCreateInvoice}
                    disabled={!selectedBookingId || creatingInvoice}
                  >
                    {creatingInvoice ? 'Opretter...' : 'Opret faktura'}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Fakturaer</TabsTrigger>
          <TabsTrigger value="dunning">Påmindelser</TabsTrigger>
          <TabsTrigger value="subscriptions">Abonnementer</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unpaidInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Afventer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{paidInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Betalt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{overdueInvoices.length}</p>
                    <p className="text-sm text-muted-foreground">Forfaldne</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Tabs */}
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Alle ({invoices.length})</TabsTrigger>
              <TabsTrigger value="unpaid">Afventer ({unpaidInvoices.length})</TabsTrigger>
              <TabsTrigger value="paid">Betalt ({paidInvoices.length})</TabsTrigger>
              {overdueInvoices.length > 0 && (
                <TabsTrigger value="overdue" className="text-destructive">
                  Forfaldne ({overdueInvoices.length})
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="all">
              <InvoiceTable invoiceList={invoices} />
            </TabsContent>
            
            <TabsContent value="unpaid">
              <InvoiceTable invoiceList={unpaidInvoices} />
            </TabsContent>
            
            <TabsContent value="paid">
              <InvoiceTable invoiceList={paidInvoices} showActions={false} />
            </TabsContent>
            
            <TabsContent value="overdue">
              <InvoiceTable invoiceList={overdueInvoices} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Dunning/Reminders Tab */}
        <TabsContent value="dunning">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Betalingspåmindelser
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Administrer automatiske betalingspåmindelser og dunning-sekvenser
                </p>
                {unpaidInvoices.length > 0 ? (
                  <div className="space-y-3">
                    {unpaidInvoices.map((invoice) => (
                      <PaymentReminder
                        key={invoice.id}
                        invoiceId={invoice.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Ingen ventende fakturaer</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Tilbagevendende Leasinger
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubscriptionManager renterId={user?.id} vehicleId="" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoicesTab;
