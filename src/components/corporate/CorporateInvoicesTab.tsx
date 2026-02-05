import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { FileText, Download, Eye, Calendar, CreditCard, Plus, Loader2 } from 'lucide-react';
import { CorporateInvoice } from '@/hooks/useCorporateFleet';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { da } from 'date-fns/locale';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';

interface CorporateInvoicesTabProps {
  invoices: CorporateInvoice[];
  corporateAccountId?: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

const CorporateInvoicesTab = ({ 
  invoices, 
  corporateAccountId,
  isAdmin = false,
  onRefresh 
}: CorporateInvoicesTabProps) => {
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const lastMonth = subMonths(new Date(), 1);
    return format(lastMonth, 'yyyy-MM');
  });

  const getStatusBadge = (status: CorporateInvoice['status']) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Betalt</Badge>;
      case 'issued':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Udstedt</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Forfalden</Badge>;
      case 'draft':
        return <Badge variant="secondary">Kladde</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Annulleret</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleGenerateInvoice = async () => {
    if (!corporateAccountId) return;

    setGenerating(true);
    try {
      const periodStart = startOfMonth(new Date(selectedMonth + '-01'));
      const periodEnd = endOfMonth(periodStart);

      const { data, error } = await supabase.functions.invoke('generate-corporate-invoice', {
        body: {
          corporate_account_id: corporateAccountId,
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
        },
      });

      if (error) throw error;

      toast.success(`Faktura ${data.invoice.invoice_number} genereret!`);
      setShowGenerateDialog(false);
      onRefresh?.();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Kunne ikke generere faktura');
    } finally {
      setGenerating(false);
    }
  };

  const unpaidTotal = invoices
    .filter(inv => inv.status === 'issued' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const paidTotal = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  // Get next invoice date (1st of next month)
  const nextInvoiceDate = startOfMonth(new Date());
  nextInvoiceDate.setMonth(nextInvoiceDate.getMonth() + 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fakturaer</h2>
          <p className="text-muted-foreground">
            {invoices.length} fakturaer i alt
          </p>
        </div>
        {isAdmin && corporateAccountId && (
          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Generer faktura
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total betalt</p>
                <p className="text-2xl font-bold">{paidTotal.toLocaleString('da-DK')} kr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubetalt</p>
                <p className="text-2xl font-bold">{unpaidTotal.toLocaleString('da-DK')} kr</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Næste faktura</p>
                <p className="text-2xl font-bold">{format(nextInvoiceDate, 'd. MMM', { locale: da })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fakturaoversigt</CardTitle>
          <CardDescription>
            Alle fakturaer for virksomhedens flådebrug
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Ingen fakturaer endnu</h3>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Klik på "Generer faktura" for at oprette den første faktura'
                  : 'Den første faktura genereres ved udgangen af den første måned'
                }
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fakturanr.</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Bookinger</TableHead>
                    <TableHead>Km kørt</TableHead>
                    <TableHead>Beløb</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono font-medium">
                        {invoice.invoice_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(invoice.invoice_period_start), 'MMM yyyy', { locale: da })}
                      </TableCell>
                      <TableCell>{invoice.total_bookings}</TableCell>
                      <TableCell>{invoice.total_km_driven.toLocaleString('da-DK')} km</TableCell>
                      <TableCell className="font-medium">
                        {invoice.total_amount.toLocaleString('da-DK')} kr
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {invoice.pdf_url && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={invoice.pdf_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Invoice Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generer månedsfaktura</DialogTitle>
            <DialogDescription>
              Vælg den måned du vil generere faktura for
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Fakturaperiode</Label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full mt-2 px-3 py-2 border rounded-md bg-background"
              max={format(subMonths(new Date(), 1), 'yyyy-MM')}
            />
            <p className="text-sm text-muted-foreground mt-2">
              Fakturaen vil inkludere alle bookinger i den valgte måned
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleGenerateInvoice} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Genererer...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generer faktura
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CorporateInvoicesTab;
