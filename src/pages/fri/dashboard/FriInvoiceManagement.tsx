import { useState, useEffect } from 'react';
import { useFriLessor } from '@/hooks/useFriLessor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileText, Eye, CheckCircle, Clock, AlertCircle, DollarSign, Loader2 } from 'lucide-react';
import { azureApi } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FriInvoice {
  id: string;
  booking_id: string;
  invoice_number: string;
  renter_name: string;
  vehicle_info: string;
  total_amount: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  created_at: string;
  due_date: string;
  paid_date?: string;
}

interface InvoiceDetail {
  invoice_id: string;
  renter_name: string;
  renter_phone: string;
  vehicle_info: string;
  pickup_date: string;
  return_date: string;
  days_booked: number;
  daily_rate: number;
  subtotal: number;
  fees: number;
  total_amount: number;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  pendingPayment: number;
  overdue: number;
  avgDaysToPayment: number;
}

const FriInvoiceManagement = () => {
  const { invoices, bookings, friLessor, refetch, isLoading } = useFriLessor();
  const [friInvoices, setFriInvoices] = useState<FriInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<FriInvoice | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetail | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    pendingPayment: 0,
    overdue: 0,
    avgDaysToPayment: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    refetch();
    loadInvoices();
  }, [refetch]);

  const loadInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const safeLessorId = (friLessor?.id || '').replace(/'/g, "''");
      const allInvoicesResponse = await azureApi.post<any>('/db/query', {
        query: `SELECT 
          i.*, 
          c.full_name AS renter_name,
          c.phone AS renter_phone,
          CONCAT(v.make, ' ', v.model) AS vehicle_info
        FROM fri_invoices i
        LEFT JOIN fri_bookings b ON i.booking_id = b.id
        LEFT JOIN fri_customers c ON i.customer_id = c.id
        LEFT JOIN fri_vehicles v ON b.vehicle_id = v.id
        WHERE i.lessor_id='${safeLessorId}'
        ORDER BY i.created_at DESC`,
      });

      const allInvoices = Array.isArray(allInvoicesResponse?.data)
        ? allInvoicesResponse.data
        : Array.isArray(allInvoicesResponse)
          ? allInvoicesResponse
          : allInvoicesResponse?.data?.recordset || allInvoicesResponse?.recordset || [];

      const invoiceList = (allInvoices || []).map((inv: any) => ({
        id: inv.id,
        booking_id: inv.booking_id,
        invoice_number: inv.invoice_number,
        renter_name: inv.renter_name || 'Ukendt',
        vehicle_info: inv.vehicle_info || 'Ukendt køretøj',
        total_amount: inv.total_amount || 0,
        status: inv.status || 'pending',
        created_at: inv.created_at,
        due_date: inv.due_date,
        paid_date: inv.paid_date,
      }));

      setFriInvoices(invoiceList);

      // Calculate stats
      const now = new Date();
      const overdue = invoiceList.filter(
        (i) => i.status === 'pending' && new Date(i.due_date) < now
      ).length;
      const totalPending = invoiceList
        .filter((i) => i.status === 'pending')
        .reduce((sum, i) => sum + i.total_amount, 0);

      setStats({
        totalInvoices: invoiceList.length,
        totalRevenue: invoiceList.reduce((sum, i) => sum + i.total_amount, 0),
        pendingPayment: totalPending,
        overdue,
        avgDaysToPayment: 0,
      });
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Kunne ikke indlæse fakturaer');
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const loadInvoiceDetails = async (invoice: FriInvoice) => {
    setIsLoadingDetails(true);
    try {
      // Find booking
      const booking = bookings.find((b: any) => b.id === invoice.booking_id);
      
      if (!booking) {
        toast.error('Booking ikke fundet');
        return;
      }

      const daysBooked = Math.ceil(
        (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const subtotal = booking.daily_rate * daysBooked;
      const fees = booking.additional_fees || 0;
      const total = subtotal + fees;

      setInvoiceDetails({
        invoice_id: invoice.id,
        renter_name: booking.renter_name || 'Ukendt',
        renter_phone: booking.renter_phone || '-',
        vehicle_info: invoice.vehicle_info,
        pickup_date: booking.start_date,
        return_date: booking.end_date,
        days_booked: daysBooked,
        daily_rate: booking.daily_rate,
        subtotal,
        fees,
        total_amount: total,
        line_items: [
          {
            description: `Billejeleje - ${daysBooked} dage`,
            quantity: daysBooked,
            unit_price: booking.daily_rate,
            total: subtotal,
          },
          ...(fees > 0 ? [{
            description: 'Ekstra gebyrer',
            quantity: 1,
            unit_price: fees,
            total: fees,
          }] : []),
        ],
      });
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Kunne ikke indlæse detaljer');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewInvoice = (invoice: FriInvoice) => {
    setSelectedInvoice(invoice);
    loadInvoiceDetails(invoice);
  };

  const handleDownloadPDF = async (invoice: FriInvoice) => {
    try {
      toast.success('PDF download startet');
      // In production, generate PDF here
    } catch (error) {
      toast.error('Kunne ikke downloade PDF');
    }
  };

  const handleUpdateStatus = async (invoice: FriInvoice, newStatus: string) => {
    try {
      const updatedInvoices = friInvoices.map((i) =>
        i.id === invoice.id ? { ...i, status: newStatus as FriInvoice['status'] } : i
      );
      setFriInvoices(updatedInvoices);
      toast.success('Status opdateret');
    } catch (error) {
      toast.error('Kunne ikke opdatere status');
    }
  };

  const filteredInvoices = friInvoices.filter((invoice) => {
    if (filterStatus !== 'all' && invoice.status !== filterStatus) return false;
    return true;
  });

  const getStatusBadge = (status: FriInvoice['status']) => {
    const variants = {
      draft: 'outline',
      pending: 'secondary',
      sent: 'default',
      paid: 'default',
    } as const;

    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
    };

    const labels = {
      draft: 'Kladde',
      pending: 'Afventer Betaling',
      sent: 'Sendt',
      paid: 'Betalt',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {labels[status]}
      </Badge>
    );
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Fakturaer</h2>
        <Button onClick={loadInvoices} disabled={isLoadingInvoices} variant="outline">
          {isLoadingInvoices ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Indlæser...
            </>
          ) : (
            'Opdater'
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Samlede Fakturaer</p>
              <p className="text-3xl font-bold">{stats.totalInvoices}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Samlet Omsætning</p>
              <p className="text-3xl font-bold">
                {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                  stats.totalRevenue
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Afventer Betaling</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                    stats.pendingPayment
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forfaldne Betalinger</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div>
              <p className="text-sm text-muted-foreground">Gennemsnitlige Dage til Betaling</p>
              <p className="text-3xl font-bold">{stats.avgDaysToPayment}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrer status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Statusser</SelectItem>
                <SelectItem value="draft">Kladde</SelectItem>
                <SelectItem value="pending">Afventer Betaling</SelectItem>
                <SelectItem value="sent">Sendt</SelectItem>
                <SelectItem value="paid">Betalt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Løbende Fakturaer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fakturanummer</TableHead>
                  <TableHead>Lejer</TableHead>
                  <TableHead>Køretøj</TableHead>
                  <TableHead>Beløb</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Forfaldsdato</TableHead>
                  <TableHead>Handlinger</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Ingen fakturaer fundet
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.renter_name}</TableCell>
                      <TableCell className="text-sm">{invoice.vehicle_info}</TableCell>
                      <TableCell className="font-semibold">
                        {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                          invoice.total_amount
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-sm">
                        {new Date(invoice.due_date).toLocaleDateString('da-DK')}
                      </TableCell>
                      <TableCell className="space-x-2 flex">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewInvoice(invoice)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Faktura Detaljer</DialogTitle>
                            </DialogHeader>
                            {isLoadingDetails ? (
                              <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin" />
                              </div>
                            ) : invoiceDetails ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-muted-foreground">Lejer</p>
                                    <p className="font-semibold">{invoiceDetails.renter_name}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Telefon</p>
                                    <p className="font-semibold">{invoiceDetails.renter_phone}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Køretøj</p>
                                    <p className="font-semibold">{invoiceDetails.vehicle_info}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Dage</p>
                                    <p className="font-semibold">{invoiceDetails.days_booked} dage</p>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <h4 className="font-semibold mb-2">Linjeposter</h4>
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Beskrivelse</TableHead>
                                          <TableHead className="text-right">Antal</TableHead>
                                          <TableHead className="text-right">Pris</TableHead>
                                          <TableHead className="text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {invoiceDetails.line_items.map((item, idx) => (
                                          <TableRow key={idx}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                              {new Intl.NumberFormat('da-DK', {
                                                style: 'currency',
                                                currency: 'DKK',
                                              }).format(item.unit_price)}
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                              {new Intl.NumberFormat('da-DK', {
                                                style: 'currency',
                                                currency: 'DKK',
                                              }).format(item.total)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  <div className="mt-4 text-right space-y-1">
                                    <p>
                                      Subtotal:{' '}
                                      {new Intl.NumberFormat('da-DK', {
                                        style: 'currency',
                                        currency: 'DKK',
                                      }).format(invoiceDetails.subtotal)}
                                    </p>
                                    <p className="text-lg font-bold">
                                      Total:{' '}
                                      {new Intl.NumberFormat('da-DK', {
                                        style: 'currency',
                                        currency: 'DKK',
                                      }).format(invoiceDetails.total_amount)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ) : null}
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadPDF(invoice)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FriInvoiceManagement;
