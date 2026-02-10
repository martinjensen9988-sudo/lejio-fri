import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/api/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  CreditCard,
  Banknote,
  FileText,
  Download,
  X,
  Check,
  Clock,
  AlertCircle,
  Plus,
  Settings,
  Loader2,
  Mail,
  DollarSign,
} from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  payment_method: string | null;
  payment_date: string | null;
  booking_id: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'invoice' | 'mobilepay';
  name: string;
  is_default: boolean;
  details: Record<string, any>;
  created_at: string;
}

interface InvoicePaymentManagerProps {
  userId: string;
}

export const InvoicePaymentManager: React.FC<InvoicePaymentManagerProps> = ({ userId }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoicePaymentDialogOpen, setInvoicePaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [requestInvoiceDialogOpen, setRequestInvoiceDialogOpen] = useState(false);
  const [requestEmail, setRequestEmail] = useState('');
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [selectedInvoiceForRequest, setSelectedInvoiceForRequest] = useState<string>('');

  useEffect(() => {
    fetchInvoices();
    fetchPaymentMethods();
  }, [userId]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);
      // Get bookings for this user
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id')
        .eq('lessor_id', userId);

      if (bookingsError) throw bookingsError;

      if (!bookings || bookings.length === 0) {
        setInvoices([]);
        return;
      }

      const bookingIds = bookings.map(b => b.id);

      // Get invoices for these bookings
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })
        .in('booking_id', bookingIds);

      if (invoicesError) throw invoicesError;

      // Determine status
      const today = new Date();
      const processed = (invoicesData || []).map((inv: any) => ({
        ...inv,
        status:
          inv.status === 'paid'
            ? 'paid'
            : inv.status === 'cancelled'
              ? 'cancelled'
              : new Date(inv.due_date) < today && inv.status !== 'paid'
                ? 'overdue'
                : 'unpaid',
      }));

      setInvoices(processed);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Kunne ikke hente fakturaer');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('lessor_payment_methods')
        .select('*')
        .eq('lessor_id', userId);

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    setSelectedInvoices((prev) =>
      prev.includes(invoiceId) ? prev.filter(id => id !== invoiceId) : [...prev, invoiceId]
    );
  };

  const handlePaymentMethodChange = (method: string) => {
    setSelectedPaymentMethod(method);
    // If invoice payment method is selected, show request dialog
    if (method === 'invoice') {
      setInvoicePaymentDialogOpen(true);
    }
  };

  const handlePayInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast.error('Vælg mindst en faktura');
      return;
    }

    if (!selectedPaymentMethod) {
      toast.error('Vælg en betalingsmetode');
      return;
    }

    setIsPaymentProcessing(true);

    try {
      // For credit card, initiate Stripe checkout
      if (selectedPaymentMethod === 'credit_card') {
        const totalAmount = invoices
          .filter(inv => selectedInvoices.includes(inv.id))
          .reduce((sum, inv) => sum + inv.amount, 0);

        const { data, error } = await supabase.functions.invoke('create-invoice-payment-session', {
          body: {
            invoiceIds: selectedInvoices,
            amount: totalAmount,
            paymentMethod: 'credit_card',
          },
        });

        if (error) throw error;
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }
      }

      // For bank transfer or invoice, mark as payment requested
      let error = null;
      for (const invoiceId of selectedInvoices) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            payment_method: selectedPaymentMethod,
            payment_requested_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);
        if (updateError) {
          error = updateError;
          break;
        }
      }

      if (error) throw error;

      toast.success(
        selectedPaymentMethod === 'invoice'
          ? 'Faktura-anmodning sendt'
          : 'Betaling registreret. Vi kontakter dig snart.'
      );

      setSelectedInvoices([]);
      setSelectedPaymentMethod('');
      setPaymentDialogOpen(false);
      await fetchInvoices();
    } catch (error: unknown) {
      console.error('Error processing payment:', error);
      toast.error('Kunne ikke behandle betaling');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleRequestInvoice = async () => {
    if (!selectedInvoiceForRequest) {
      toast.error('Vælg en faktura');
      return;
    }

    setIsPaymentProcessing(true);

    try {
      const { error } = await supabase
        .from('invoices')
        .update({
          payment_method: 'invoice',
          payment_requested_at: new Date().toISOString(),
        })
        .eq('id', selectedInvoiceForRequest);

      if (error) throw error;

      // Send email notification about invoice payment request
      await supabase.functions.invoke('send-invoice-payment-request', {
        body: {
          invoiceId: selectedInvoiceForRequest,
          email: requestEmail,
        },
      });

      toast.success('Faktura-anmodning sendt til ' + requestEmail);
      setRequestInvoiceDialogOpen(false);
      setSelectedInvoiceForRequest('');
      setRequestEmail('');
      await fetchInvoices();
    } catch (error: unknown) {
      console.error('Error sending invoice request:', error);
      toast.error('Kunne ikke sende faktura-anmodning');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) throw error;

      // Request PDF generation from backend
      const { data: pdfData, error: pdfError } = await supabase.functions.invoke(
        'generate-invoice-pdf',
        {
          body: { invoiceId },
        }
      );

      if (pdfError) throw pdfError;

      // Download PDF
      if (pdfData?.url) {
        const link = document.createElement('a');
        link.href = pdfData.url;
        link.download = `Faktura-${data.invoice_number}.pdf`;
        link.click();
      }
    } catch (error: unknown) {
      console.error('Error downloading invoice:', error);
      toast.error('Kunne ikke downloade faktura');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-700';
      case 'unpaid':
        return 'bg-blue-500/10 text-blue-700';
      case 'overdue':
        return 'bg-red-500/10 text-red-700';
      case 'cancelled':
        return 'bg-gray-500/10 text-gray-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'unpaid':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Betalt';
      case 'unpaid':
        return 'Ubetalt';
      case 'overdue':
        return 'Forfaldent';
      case 'cancelled':
        return 'Annulleret';
      default:
        return status;
    }
  };

  const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid' || inv.status === 'overdue');
  const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invoices" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Fakturaer</TabsTrigger>
          <TabsTrigger value="payment-methods">Betalingsmetoder</TabsTrigger>
          <TabsTrigger value="history">Betalingshistorik</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-4">
          {unpaidInvoices.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Udestående betaling
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700">
                  {totalUnpaid.toLocaleString('da-DK')} kr
                </div>
                <p className="text-sm text-orange-600 mt-2">
                  {unpaidInvoices.length} faktura{unpaidInvoices.length !== 1 ? 'er' : ''}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Alle fakturaer</CardTitle>
                {unpaidInvoices.length > 0 && (
                  <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Betal fakturaer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Vælg betalingsmetode</DialogTitle>
                        <DialogDescription>
                          Samlet beløb: {totalUnpaid.toLocaleString('da-DK')} kr
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          {/* Credit Card Option */}
                          <button
                            onClick={() => handlePaymentMethodChange('credit_card')}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === 'credit_card'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <CreditCard className="w-5 h-5 text-blue-600" />
                              <div className="text-left">
                                <div className="font-semibold">Kreditkort</div>
                                <div className="text-sm text-gray-500">Betaling med kort med det samme</div>
                              </div>
                              {selectedPaymentMethod === 'credit_card' && (
                                <Check className="w-4 h-4 text-blue-600 ml-auto" />
                              )}
                            </div>
                          </button>

                          {/* Bank Transfer Option */}
                          <button
                            onClick={() => handlePaymentMethodChange('bank_transfer')}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === 'bank_transfer'
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Banknote className="w-5 h-5 text-green-600" />
                              <div className="text-left">
                                <div className="font-semibold">Bankoverførsel</div>
                                <div className="text-sm text-gray-500">Vi sender dig betalingsinstruktioner</div>
                              </div>
                              {selectedPaymentMethod === 'bank_transfer' && (
                                <Check className="w-4 h-4 text-green-600 ml-auto" />
                              )}
                            </div>
                          </button>

                          {/* Invoice Option */}
                          <button
                            onClick={() => handlePaymentMethodChange('invoice')}
                            className={`w-full p-4 rounded-lg border-2 transition-all ${
                              selectedPaymentMethod === 'invoice'
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="w-5 h-5 text-purple-600" />
                              <div className="text-left">
                                <div className="font-semibold">Faktura / Email</div>
                                <div className="text-sm text-gray-500">Vi sender betalingsanmodning til email</div>
                              </div>
                              {selectedPaymentMethod === 'invoice' && (
                                <Check className="w-4 h-4 text-purple-600 ml-auto" />
                              )}
                            </div>
                          </button>
                        </div>

                        <div className="flex gap-2 pt-4">
                          <Button
                            onClick={handlePayInvoices}
                            disabled={isPaymentProcessing || !selectedPaymentMethod}
                            className="flex-1"
                          >
                            {isPaymentProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Fortsæt
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(false)}
                            className="flex-1"
                          >
                            Annuller
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : invoices.length > 0 ? (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">Fakturanummer</TableHead>
                        <TableHead className="font-semibold">Beløb</TableHead>
                        <TableHead className="font-semibold">Forfaldsdato</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Handling</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.map((invoice) => (
                        <TableRow key={invoice.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell className="font-semibold">
                            {invoice.amount.toLocaleString('da-DK')} kr
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(invoice.due_date), 'd. MMM yyyy', { locale: da })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(invoice.status)}
                              <Badge className={getStatusColor(invoice.status)}>
                                {getStatusLabel(invoice.status)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice.id)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                                <Dialog
                                  open={invoicePaymentDialogOpen && selectedInvoiceForRequest === invoice.id}
                                  onOpenChange={(open) => {
                                    if (!open) {
                                      setSelectedInvoiceForRequest('');
                                      setRequestEmail('');
                                    }
                                  }}
                                >
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedInvoiceForRequest(invoice.id)}
                                    >
                                      <Mail className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  {selectedInvoiceForRequest === invoice.id && (
                                    <DialogContent className="sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle>Anmod faktura via email</DialogTitle>
                                        <DialogDescription>
                                          Faktura: {invoice.invoice_number} ({invoice.amount.toLocaleString('da-DK')} kr)
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <label className="text-sm font-medium">Din email</label>
                                          <Input
                                            type="email"
                                            value={requestEmail}
                                            onChange={(e) => setRequestEmail(e.target.value)}
                                            placeholder="din@email.dk"
                                          />
                                        </div>
                                        <div className="flex gap-2">
                                          <Button
                                            onClick={handleRequestInvoice}
                                            disabled={isPaymentProcessing || !requestEmail}
                                            className="flex-1"
                                          >
                                            {isPaymentProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                            Send anmodning
                                          </Button>
                                          <Button
                                            variant="outline"
                                            onClick={() => {
                                              setSelectedInvoiceForRequest('');
                                              setRequestEmail('');
                                            }}
                                            className="flex-1"
                                          >
                                            Annuller
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  )}
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Ingen fakturaer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gemte betalingsmetoder</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Tilføj metode
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="p-4 rounded-lg border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {method.type === 'credit_card' && <CreditCard className="w-5 h-5" />}
                        {method.type === 'bank_transfer' && <Banknote className="w-5 h-5" />}
                        {method.type === 'invoice' && <FileText className="w-5 h-5" />}
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Tilføjet {format(new Date(method.created_at), 'd. MMM yyyy', { locale: da })}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {method.is_default && <Badge>Standardmetode</Badge>}
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Ingen betalingsmetoder gemte</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Betalingshistorik</CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.filter(inv => inv.status === 'paid').length > 0 ? (
                <div className="space-y-3">
                  {invoices
                    .filter(inv => inv.status === 'paid')
                    .map((invoice) => (
                      <div
                        key={invoice.id}
                        className="p-4 rounded-lg border flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium">{invoice.invoice_number}</div>
                          <div className="text-sm text-muted-foreground">
                            Betalt{' '}
                            {invoice.payment_date
                              ? format(new Date(invoice.payment_date), 'd. MMM yyyy', { locale: da })
                              : 'dato ukendt'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{invoice.amount.toLocaleString('da-DK')} kr</div>
                          <Badge className={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Check className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Ingen betalte fakturaer</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
