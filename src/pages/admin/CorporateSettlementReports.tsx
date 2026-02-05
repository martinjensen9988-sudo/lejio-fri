import { useState, useEffect } from 'react';
import { useCorporateFleet } from '@/hooks/useCorporateFleet';
import { AdminDashboardLayout } from '@/components/admin/AdminDashboardLayout';
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
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SettlementReport {
  id: string;
  month: string;
  year: number;
  corporate_account_id: string;
  company_name: string;
  total_amount: number;
  department_count: number;
  line_item_count: number;
  status: 'draft' | 'pending' | 'sent' | 'paid';
  created_at: string;
  due_date: string;
  paid_date?: string;
}

interface SettlementDetail {
  report_id: string;
  department_name: string;
  department_cost_center: string;
  booking_count: number;
  total_km: number;
  total_amount: number;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
}

interface DashboardStats {
  totalReports: number;
  totalRevenue: number;
  pendingPayment: number;
  overdue: number;
  avgDaysToPayment: number;
}

const CorporateSettlementReports = () => {
  const { invoices, refetch, isLoading } = useCorporateFleet();
  const [reports, setReports] = useState<SettlementReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SettlementReport | null>(null);
  const [reportDetails, setReportDetails] = useState<SettlementDetail | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalReports: 0,
    totalRevenue: 0,
    pendingPayment: 0,
    overdue: 0,
    avgDaysToPayment: 0,
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [isLoadingReports, setIsLoadingReports] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    refetch();
    loadReports();
  }, [refetch]);

  const loadReports = async () => {
    setIsLoadingReports(true);
    try {
      // For now, we'll create mock data since settlement reports may not exist yet
      // In production, fetch from corporate_invoices and aggregate
      const { data: invoices, error } = await supabase
        .from('corporate_invoices')
        .select('*, corporate_account_id');

      if (error) throw error;

      // Group invoices by month and corporate account
      const reportMap = new Map<string, SettlementReport>();

      if (invoices && Array.isArray(invoices)) {
        invoices.forEach((invoice) => {
          const date = new Date(invoice.created_at || new Date());
          const month = date.toLocaleDateString('da-DK', { month: 'long' });
          const year = date.getFullYear();
          const key = `${invoice.corporate_account_id}-${year}-${month}`;

          if (!reportMap.has(key)) {
            reportMap.set(key, {
              id: `report-${key}`,
              month,
              year,
              corporate_account_id: invoice.corporate_account_id,
              company_name: 'Ukendt Virksomhed',
              total_amount: 0,
              department_count: 0,
              line_item_count: 0,
              status: 'sent',
              created_at: new Date().toISOString(),
              due_date: new Date(date.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            });
          }

          const report = reportMap.get(key)!;
          report.total_amount += invoice.total_amount || 0;
          report.line_item_count += Array.isArray(invoice.department_breakdown) ? invoice.department_breakdown.length : 0;
        });
      }

      const reportList = Array.from(reportMap.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setReports(reportList);

      // Calculate stats
      const now = new Date();
      const overdue = reportList.filter(
        (r) => r.status === 'pending' && new Date(r.due_date) < now
      ).length;
      const totalPending = reportList
        .filter((r) => r.status === 'pending')
        .reduce((sum, r) => sum + r.total_amount, 0);

      setStats({
        totalReports: reportList.length,
        totalRevenue: reportList.reduce((sum, r) => sum + r.total_amount, 0),
        pendingPayment: totalPending,
        overdue,
        avgDaysToPayment: 0, // Calculate from actual paid dates
      });
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Kunne ikke indlæse rapporter');
    } finally {
      setIsLoadingReports(false);
    }
  };

  const loadReportDetails = async (report: SettlementReport) => {
    setIsLoadingDetails(true);
    try {
      // Mock detaljer - i produktion hent fra database
      setReportDetails({
        report_id: report.id,
        department_name: 'Main Department',
        department_cost_center: 'CC-001',
        booking_count: 12,
        total_km: 1250,
        total_amount: report.total_amount,
        line_items: [
          {
            description: 'Billeje - 5 dage',
            quantity: 5,
            unit_price: 500,
            total: 2500,
          },
          {
            description: 'Ekstra km - 250 km',
            quantity: 250,
            unit_price: 2,
            total: 500,
          },
          {
            description: 'Brændstoftillæg',
            quantity: 1,
            unit_price: 150,
            total: 150,
          },
        ],
      });
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Kunne ikke indlæse detaljer');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleViewReport = (report: SettlementReport) => {
    setSelectedReport(report);
    loadReportDetails(report);
  };

  const handleDownloadPDF = async (report: SettlementReport) => {
    try {
      toast.success('PDF download startet');
      // In production, generate PDF here
    } catch (error) {
      toast.error('Kunne ikke downloade PDF');
    }
  };

  const handleUpdateStatus = async (report: SettlementReport, newStatus: string) => {
    try {
      // I produktion, opdater i database
      const updatedReports = reports.map((r) =>
        r.id === report.id ? { ...r, status: newStatus as SettlementReport['status'] } : r
      );
      setReports(updatedReports);
      toast.success('Status opdateret');
    } catch (error) {
      toast.error('Kunne ikke opdatere status');
    }
  };

  const filteredReports = reports.filter((report) => {
    if (filterStatus !== 'all' && report.status !== filterStatus) return false;
    if (filterMonth && `${report.month} ${report.year}` !== filterMonth) return false;
    return true;
  });

  const getStatusBadge = (status: SettlementReport['status']) => {
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
      <AdminDashboardLayout activeTab="corporate">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminDashboardLayout>
    );
  }

  return (
    <AdminDashboardLayout activeTab="corporate">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold">Settlement Reports</h2>
          <Button onClick={loadReports} disabled={isLoadingReports} variant="outline">
            {isLoadingReports ? (
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
                <p className="text-sm text-muted-foreground">Samlede Rapporter</p>
                <p className="text-3xl font-bold">{stats.totalReports}</p>
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

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle>Løbende Rapporter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Virksomhed</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Beløb</TableHead>
                    <TableHead>Linier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Forfaldsdato</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Ingen rapporter fundet
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.company_name}</TableCell>
                        <TableCell>
                          {report.month} {report.year}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(
                            report.total_amount
                          )}
                        </TableCell>
                        <TableCell>{report.line_item_count}</TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(report.due_date).toLocaleDateString('da-DK')}
                        </TableCell>
                        <TableCell className="space-x-2 flex">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewReport(report)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Rapportdetaljer</DialogTitle>
                              </DialogHeader>
                              {isLoadingDetails ? (
                                <div className="flex justify-center py-8">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                              ) : reportDetails ? (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Afdeling</p>
                                      <p className="font-semibold">{reportDetails.department_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Cost Center</p>
                                      <p className="font-semibold">{reportDetails.department_cost_center}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Bookinger</p>
                                      <p className="font-semibold">{reportDetails.booking_count}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Total KM</p>
                                      <p className="font-semibold">{reportDetails.total_km} km</p>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold mb-2">Linieposter</h4>
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
                                          {reportDetails.line_items.map((item, idx) => (
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

                                    <div className="mt-4 text-right">
                                      <p className="text-lg font-bold">
                                        Total:{' '}
                                        {new Intl.NumberFormat('da-DK', {
                                          style: 'currency',
                                          currency: 'DKK',
                                        }).format(reportDetails.total_amount)}
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
                            onClick={() => handleDownloadPDF(report)}
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
    </AdminDashboardLayout>
  );
};

export default CorporateSettlementReports;
