import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wallet, TrendingDown, AlertTriangle, Building2, 
  Car, Upload, FileText, Download, Loader2, Eye,
  Calculator, CheckCircle, Clock, X, CreditCard, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';

interface CustomerDebt {
  id: string;
  company_name: string | null;
  full_name: string | null;
  email: string;
  fleet_plan: string | null;
  fleet_commission_rate: number | null;
  fleet_contract_months: number | null;
  totalDebt: number;
  monthlyInstallments: number;
  activeLoans: Loan[];
  vehicles: VehicleWithDebt[];
  pendingRequests: LoanRequest[];
}

interface Loan {
  id: string;
  vehicle_id: string | null;
  description: string;
  original_amount: number;
  remaining_balance: number;
  monthly_installment: number;
  setup_fee: number;
  remaining_months: number;
  status: string;
  platform_fee_paid_at?: string | null;
  start_date: string;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
}

interface VehicleWithDebt {
  id: string;
  make: string;
  model: string;
  registration: string;
  debt: number;
  monthlyInstallment: number;
}

interface LoanRequest {
  id: string;
  vehicle_id: string | null;
  requested_amount: number;
  description: string;
  status: string;
  created_at: string;
  invoice_url: string | null;
  invoice_filename: string | null;
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
}

export const AdminFleetFinance = () => {
    const handleMarkFeePaid = async (loanId: string) => {
      try {
        const { error } = await supabase
          .from('fleet_vehicle_loans')
          .update({ platform_fee_paid_at: new Date().toISOString() })
          .eq('id', loanId);
        if (error) throw error;
        toast.success('Platformgebyr markeret som betalt');
        fetchFinanceData();
      } catch (err) {
        toast.error('Kunne ikke markere gebyr som betalt');
      }
    };
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showConsolidationDialog, setShowConsolidationDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDebt | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConsolidating, setIsConsolidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadForm, setUploadForm] = useState({
    vehicle_id: '',
    amount: '',
    workshop_name: '',
    description: '',
  });

  const [consolidationForm, setConsolidationForm] = useState({
    new_amount: '',
    description: '',
  });

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [statement, setStatement] = useState<unknown>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const fetchFinanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch all fleet customers
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, company_name, fleet_plan, fleet_commission_rate, fleet_contract_months')
        .not('fleet_plan', 'is', null);

      if (profilesError) throw profilesError;

      // Fetch all active loans
      const { data: loansData, error: loansError } = await supabase
        .from('fleet_vehicle_loans')
        .select(`
          *,
          vehicle:vehicles(make, model, registration)
        `)
        .eq('status', 'active');

      if (loansError) throw loansError;

      // Fetch all pending loan requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('fleet_loan_requests')
        .select(`
          *,
          vehicle:vehicles(make, model, registration)
        `)
        .eq('status', 'pending');

      if (requestsError) throw requestsError;

      // Fetch all vehicles for fleet customers
      const ownerIds = (profilesData || []).map(p => p.id);
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, owner_id, make, model, registration')
        .in('owner_id', ownerIds);

      if (vehiclesError) throw vehiclesError;

      // Build customer debt overview
      const customerDebtList: CustomerDebt[] = (profilesData || []).map(profile => {
        const customerLoans = (loansData || []).filter(l => l.lessor_id === profile.id) as unknown as Loan[];
        const customerRequests = (requestsData || []).filter(r => r.lessor_id === profile.id) as unknown as LoanRequest[];
        const customerVehicles = (vehiclesData || []).filter(v => v.owner_id === profile.id);

        const totalDebt = customerLoans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
        const monthlyInstallments = customerLoans.reduce((sum, l) => sum + (l.monthly_installment || 0), 0);

        // Calculate debt per vehicle
        const vehiclesWithDebt: VehicleWithDebt[] = customerVehicles.map(v => {
          const vehicleLoans = customerLoans.filter(l => l.vehicle_id === v.id);
          return {
            id: v.id,
            make: v.make,
            model: v.model,
            registration: v.registration,
            debt: vehicleLoans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0),
            monthlyInstallment: vehicleLoans.reduce((sum, l) => sum + (l.monthly_installment || 0), 0),
          };
        });

        return {
          id: profile.id,
          company_name: profile.company_name,
          full_name: profile.full_name,
          email: profile.email,
          fleet_plan: profile.fleet_plan,
          fleet_commission_rate: profile.fleet_commission_rate,
          fleet_contract_months: profile.fleet_contract_months,
          totalDebt,
          monthlyInstallments,
          activeLoans: customerLoans,
          vehicles: vehiclesWithDebt,
          pendingRequests: customerRequests,
        };
      });

      // Sort by debt (highest first)
      customerDebtList.sort((a, b) => b.totalDebt - a.totalDebt);
      setCustomers(customerDebtList);
    } catch (error) {
      console.error('Error fetching finance data:', error);
      toast.error('Kunne ikke hente finansdata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleOpenUploadDialog = (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setUploadForm({
      vehicle_id: customer.vehicles[0]?.id || '',
      amount: '',
      workshop_name: '',
      description: '',
    });
    setShowUploadDialog(true);
  };

  const handleOpenConsolidationDialog = (customer: CustomerDebt) => {
    setSelectedCustomer(customer);
    setConsolidationForm({
      new_amount: '',
      description: '',
    });
    setShowConsolidationDialog(true);
  };

  const handleConsolidateDebt = async () => {
    if (!selectedCustomer || !consolidationForm.new_amount) return;

    const newAmount = parseFloat(consolidationForm.new_amount);
    if (newAmount < 500) {
      toast.error('Beløb skal være minimum 500 kr');
      return;
    }

    setIsConsolidating(true);
    try {
      // Calculate new consolidated loan
      const existingDebt = selectedCustomer.totalDebt;
      const setupFee = 300;
      const totalNewDebt = existingDebt + newAmount + setupFee;
      const contractMonths = selectedCustomer.fleet_contract_months || 12;
      const remainingMonths = Math.max(3, contractMonths);
      const newMonthlyInstallment = Math.ceil(totalNewDebt / remainingMonths);

      // Mark all existing loans as cancelled
      for (const loan of selectedCustomer.activeLoans) {
        await supabase
          .from('fleet_vehicle_loans')
          .update({ status: 'cancelled' })
          .eq('id', loan.id);
      }

      // Create new consolidated loan
      const primaryVehicle = selectedCustomer.vehicles[0];
      const { error: loanError } = await supabase.from('fleet_vehicle_loans').insert({
        vehicle_id: primaryVehicle?.id || null,
        lessor_id: selectedCustomer.id,
        description: `Konsolideret gæld: ${consolidationForm.description || 'Ny reparation tilføjet eksisterende lån'}`,
        original_amount: totalNewDebt - setupFee,
        remaining_balance: totalNewDebt - setupFee,
        monthly_installment: newMonthlyInstallment,
        setup_fee: setupFee,
        remaining_months: remainingMonths,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      if (loanError) throw loanError;

      toast.success(`Gæld konsolideret! Nyt afdrag: ${formatCurrency(newMonthlyInstallment)} kr/mdr`);
      setShowConsolidationDialog(false);
      fetchFinanceData();
    } catch (error) {
      console.error('Error consolidating debt:', error);
      toast.error('Kunne ikke konsolidere gæld');
    } finally {
      setIsConsolidating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCustomer) return;

    if (file.type !== 'application/pdf') {
      toast.error('Kun PDF-filer er tilladt');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen må maks være 10MB');
      return;
    }

    if (!uploadForm.vehicle_id || !uploadForm.amount) {
      toast.error('Vælg køretøj og angiv beløb');
      return;
    }

    // Validate minimum amount (500 kr)
    const amount = parseFloat(uploadForm.amount);
    if (amount < 500) {
      toast.error('Lånebeløb skal være minimum 500 kr');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${selectedCustomer.id}/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('workshop-invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Calculate installments based on contract months
      const contractMonths = selectedCustomer.fleet_contract_months || 12;
      const remainingMonths = Math.max(3, contractMonths);
      const setupFee = 300;
      const amount = parseFloat(uploadForm.amount);
      const totalWithFee = amount + setupFee;
      const monthlyInstallment = Math.ceil(totalWithFee / remainingMonths);

      // Create loan directly (admin-initiated)
      const { error: loanError } = await supabase.from('fleet_vehicle_loans').insert({
        vehicle_id: uploadForm.vehicle_id,
        lessor_id: selectedCustomer.id,
        description: uploadForm.description || `Værkstedsregning: ${uploadForm.workshop_name || 'Ukendt værksted'}`,
        original_amount: amount,
        remaining_balance: amount,
        monthly_installment: monthlyInstallment,
        setup_fee: setupFee,
        remaining_months: remainingMonths,
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      if (loanError) throw loanError;

      toast.success(`Lån oprettet: ${formatCurrency(amount)} kr - afdrag ${formatCurrency(monthlyInstallment)} kr/mdr over ${remainingMonths} mdr`);
      setShowUploadDialog(false);
      fetchFinanceData();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Kunne ikke oprette lån');
    } finally {
      setIsUploading(false);
    }
  };

  // Filter customers based on search
  const filteredCustomers = customers.filter(c => {
    const searchLower = searchQuery.toLowerCase();
    return (
      c.company_name?.toLowerCase().includes(searchLower) ||
      c.full_name?.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const totalSystemDebt = customers.reduce((sum, c) => sum + c.totalDebt, 0);
  const totalMonthlyInstallments = customers.reduce((sum, c) => sum + c.monthlyInstallments, 0);
  const customersWithDebt = customers.filter(c => c.totalDebt > 0).length;
  const pendingRequestsTotal = customers.reduce((sum, c) => sum + c.pendingRequests.length, 0);

  const calculateStatement = async (customerId: string, commissionRate: number) => {
    setIsCalculating(true);
    setStatement(null);
    try {
      // Find start og slutdato for måneden
      const [year, month] = selectedMonth.split('-');
      const startDate = `${year}-${month}-01`;
      const endDate = format(new Date(Number(year), Number(month), 0), 'yyyy-MM-dd');
      // Hent bookinger for kunden i perioden
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('id, total_price, status, start_date, end_date, vehicle_id, renter_name')
        .eq('lessor_id', customerId)
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .in('status', ['completed', 'active']);
      if (error) throw error;
      const totalRevenue = (bookings || []).reduce((sum, b) => sum + (b.total_price || 0), 0);
      // Sikrer at Fleet Premium altid bruger 35% kommission
      let actualCommissionRate = commissionRate;
      if (selectedCustomer?.fleet_plan === 'premium') {
        actualCommissionRate = 35;
      }
      const commission = Math.round(totalRevenue * (actualCommissionRate / 100));
      const payout = totalRevenue - commission;
      setStatement({ totalRevenue, commission, payout, count: (bookings || []).length, bookings });
    } catch (err) {
      setStatement({ error: 'Kunne ikke beregne opgørelse' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Download opgørelse som PDF
  const downloadStatementPDF = () => {
    if (!statement) return;
    const doc = new jsPDF();
    // Logo (hvis muligt)
    // doc.addImage('/public/lejio-logo.png', 'PNG', 150, 10, 40, 12); // kræver base64 eller ekstern url
    doc.setFontSize(18);
    doc.text('Lejio - Månedlig Opgørelse', 10, 20);
    doc.setFontSize(12);
    doc.text(`Periode: ${selectedMonth}`, 10, 30);
    if (selectedCustomer) {
      doc.text(`Kunde: ${selectedCustomer.company_name || selectedCustomer.full_name || selectedCustomer.email}`, 10, 38);
      doc.text(`E-mail: ${selectedCustomer.email}`, 10, 44);
    }
    doc.text(`Omsætning: ${statement.totalRevenue} kr`, 10, 54);
    doc.text(`Kommission: ${statement.commission} kr`, 10, 62);
    doc.text(`Udbetaling: ${statement.payout} kr`, 10, 70);
    doc.text(`Antal bookinger: ${statement.count}`, 10, 78);
    // Tabel med bookinger
    if (statement.bookings && statement.bookings.length > 0) {
      doc.setFontSize(11);
      doc.text('Bookinger:', 10, 88);
      let y = 94;
      doc.setFont('helvetica', 'bold');
      doc.text('Dato', 10, y);
      doc.text('Bil', 45, y);
      doc.text('Lejer', 100, y);
      doc.text('Pris', 150, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
      statement.bookings.forEach((b: unknown) => {
        doc.text(`${b.start_date} - ${b.end_date}`, 10, y);
        doc.text(`${b.vehicle_id || ''}`, 45, y); // evt. slå op på bilnavn
        doc.text(`${b.renter_name || ''}`, 100, y);
        doc.text(`${b.total_price || 0} kr`, 150, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }
    doc.save('opgørelse.pdf');
  };

  // Opret faktura (dummy - skal evt. kobles til backend)
  const createInvoice = async () => {
    if (!selectedCustomer || !statement) return;
    setIsCalculating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice', {
        body: {
          lessor_id: selectedCustomer.id,
          month: selectedMonth,
          total_revenue: statement.totalRevenue,
          commission: statement.commission,
          payout: statement.payout,
          bookings: statement.bookings,
        }
      });
      if (error || !data || !data.invoice) throw error || new Error('Ingen faktura retur');
      toast.success(`Faktura oprettet: ${data.invoice.invoice_number}`);
      if (data.invoice.pdf_url) {
        window.open(data.invoice.pdf_url, '_blank');
      }
    } catch (err: unknown) {
      toast.error('Kunne ikke oprette faktura: ' + (err?.message || err));
    } finally {
      setIsCalculating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Henter finansoverblik...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-destructive/20 rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalSystemDebt)} kr</p>
                <p className="text-xs text-muted-foreground">Samlet udestående gæld</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthlyInstallments)} kr</p>
                <p className="text-xs text-muted-foreground">Månedlige afdrag</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/50 border-secondary/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-secondary/30 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{customersWithDebt}</p>
                <p className="text-xs text-muted-foreground">Kunder med aktive lån</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingRequestsTotal}</p>
                <p className="text-xs text-muted-foreground">Afventer godkendelse</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer Debt List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Gældsoverblik pr. Kunde
              </CardTitle>
              <CardDescription>
                Udestående lån og månedlige afdrag for hver fleet-kunde
              </CardDescription>
            </div>
            <Input
              placeholder="Søg kunde..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="space-y-2">
            {filteredCustomers.map((customer) => (
              <AccordionItem 
                key={customer.id} 
                value={customer.id}
                className={cn(
                  "border rounded-xl px-4",
                  customer.totalDebt > 0 && "border-destructive/30 bg-destructive/5"
                )}
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">{customer.company_name || customer.full_name || customer.email}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.vehicles.length} køretøjer · {customer.activeLoans.length} aktive lån
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {customer.pendingRequests.length > 0 && (
                        <Badge variant="outline" className="gap-1 border-amber-500 text-amber-500">
                          <Clock className="w-3 h-3" />
                          {customer.pendingRequests.length} afventer
                        </Badge>
                      )}
                      <div className="text-right">
                        <p className={cn(
                          "text-lg font-bold",
                          customer.totalDebt > 0 ? "text-destructive" : "text-mint"
                        )}>
                          {formatCurrency(customer.totalDebt)} kr
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(customer.monthlyInstallments)} kr/mdr
                        </p>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <div className="space-y-4 pt-2">
                    {/* Vehicles with debt breakdown */}
                    {customer.vehicles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Køretøjer</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {customer.vehicles.map(vehicle => (
                            <div 
                              key={vehicle.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg border",
                                vehicle.debt > 0 && "bg-destructive/5 border-destructive/20"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Car className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{vehicle.registration}</span>
                                <span className="text-sm text-muted-foreground">
                                  {vehicle.make} {vehicle.model}
                                </span>
                              </div>
                              <div className="text-right">
                                <p className={cn(
                                  "font-semibold",
                                  vehicle.debt > 0 ? "text-destructive" : "text-mint"
                                )}>
                                  {vehicle.debt > 0 ? `${formatCurrency(vehicle.debt)} kr` : 'Ingen gæld'}
                                </p>
                                {vehicle.monthlyInstallment > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatCurrency(vehicle.monthlyInstallment)} kr/mdr
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active loans details */}
                    {customer.activeLoans.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Aktive lån</p>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Beskrivelse</TableHead>
                              <TableHead>Køretøj</TableHead>
                              <TableHead className="text-right">Oprindeligt</TableHead>
                              <TableHead className="text-right">Resterende</TableHead>
                              <TableHead className="text-right">Afdrag</TableHead>
                              <TableHead className="text-right">Mdr. tilbage</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {customer.activeLoans.map(loan => (
                              <TableRow key={loan.id}>
                                <TableCell className="font-medium">{loan.description}</TableCell>
                                <TableCell>
                                  {loan.vehicle ? `${loan.vehicle.registration}` : '-'}
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(loan.original_amount)} kr</TableCell>
                                <TableCell className="text-right text-destructive font-semibold">
                                  {formatCurrency(loan.remaining_balance)} kr
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(loan.monthly_installment)} kr</TableCell>
                                <TableCell className="text-right">{loan.remaining_months}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => handleOpenUploadDialog(customer)}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        Upload værkstedsfaktura
                      </Button>
                      {customer.activeLoans.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleOpenConsolidationDialog(customer)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Konsolidér gæld
                        </Button>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'Ingen kunder matcher søgningen' : 'Ingen fleet-kunder endnu'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Invoice Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload værkstedsfaktura</DialogTitle>
            <DialogDescription>
              Upload en PDF-faktura og opret automatisk et lån med afdrag baseret på resterende kontraktperiode.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCustomer && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedCustomer.company_name || selectedCustomer.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  Kontraktperiode: {selectedCustomer.fleet_contract_months || 12} måneder
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Køretøj</Label>
              <Select
                value={uploadForm.vehicle_id}
                onValueChange={(v) => setUploadForm(prev => ({ ...prev, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCustomer?.vehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Beløb (kr) - minimum 500 kr</Label>
              <Input
                type="number"
                min="500"
                placeholder="F.eks. 5000"
                value={uploadForm.amount}
                onChange={(e) => setUploadForm(prev => ({ ...prev, amount: e.target.value }))}
              />
              {uploadForm.amount && parseFloat(uploadForm.amount) < 500 && (
                <p className="text-sm text-destructive">Beløb skal være minimum 500 kr</p>
              )}
              {uploadForm.amount && parseFloat(uploadForm.amount) >= 500 && selectedCustomer && (
                <p className="text-sm text-muted-foreground">
                  + 300 kr oprettelsesgebyr = {formatCurrency(parseFloat(uploadForm.amount) + 300)} kr fordelt over{' '}
                  {Math.max(3, selectedCustomer.fleet_contract_months || 12)} måneder ={' '}
                  <strong>
                    {formatCurrency(Math.ceil((parseFloat(uploadForm.amount) + 300) / Math.max(3, selectedCustomer.fleet_contract_months || 12)))} kr/mdr
                  </strong>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Værksted (valgfrit)</Label>
              <Input
                placeholder="Værkstedets navn"
                value={uploadForm.workshop_name}
                onChange={(e) => setUploadForm(prev => ({ ...prev, workshop_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse (valgfrit)</Label>
              <Textarea
                placeholder="Beskrivelse af reparationen..."
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Annuller
            </Button>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || !uploadForm.vehicle_id || !uploadForm.amount}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploader...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Vælg PDF og opret lån
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Consolidation Dialog */}
      <Dialog open={showConsolidationDialog} onOpenChange={setShowConsolidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konsolidér gæld</DialogTitle>
            <DialogDescription>
              Læg en ny reparation oveni eksisterende gæld. Der pålægges et nyt gebyr på 300 kr.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedCustomer && (
              <>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{selectedCustomer.company_name || selectedCustomer.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Nuværende restgæld: <span className="text-destructive font-semibold">{formatCurrency(selectedCustomer.totalDebt)} kr</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nuværende månedlige afdrag: {formatCurrency(selectedCustomer.monthlyInstallments)} kr/mdr
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Nyt beløb at tilføje (kr) - minimum 500 kr</Label>
                  <Input
                    type="number"
                    min="500"
                    placeholder="F.eks. 3000"
                    value={consolidationForm.new_amount}
                    onChange={(e) => setConsolidationForm(prev => ({ ...prev, new_amount: e.target.value }))}
                  />
                  {consolidationForm.new_amount && parseFloat(consolidationForm.new_amount) < 500 && (
                    <p className="text-sm text-destructive">Beløb skal være minimum 500 kr</p>
                  )}
                  {consolidationForm.new_amount && parseFloat(consolidationForm.new_amount) >= 500 && (
                    <div className="p-3 bg-accent/30 rounded-lg text-sm space-y-1">
                      <p>Ny reparation: {formatCurrency(parseFloat(consolidationForm.new_amount))} kr</p>
                      <p>+ Eksisterende restgæld: {formatCurrency(selectedCustomer.totalDebt)} kr</p>
                      <p>+ Nyt gebyr: 300 kr</p>
                      <p className="font-semibold border-t pt-1 mt-1">
                        = Ny samlet gæld: {formatCurrency(parseFloat(consolidationForm.new_amount) + selectedCustomer.totalDebt + 300)} kr
                      </p>
                      <p className="text-muted-foreground">
                        Nyt afdrag: {formatCurrency(Math.ceil((parseFloat(consolidationForm.new_amount) + selectedCustomer.totalDebt + 300) / Math.max(3, selectedCustomer.fleet_contract_months || 12)))} kr/mdr
                        over {Math.max(3, selectedCustomer.fleet_contract_months || 12)} måneder
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Beskrivelse af reparation</Label>
                  <Textarea
                    placeholder="Beskriv hvad den nye reparation dækker..."
                    value={consolidationForm.description}
                    onChange={(e) => setConsolidationForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConsolidationDialog(false)}>
              Annuller
            </Button>
            <Button 
              onClick={handleConsolidateDebt}
              disabled={isConsolidating || !consolidationForm.new_amount || parseFloat(consolidationForm.new_amount) < 500}
            >
              {isConsolidating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Konsoliderer...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Konsolidér gæld
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Monthly Statement Section */}
      <Card>
        <CardHeader>
          <CardTitle>Månedlig Opgørelse</CardTitle>
          <CardDescription>
            Beregn og vis månedlig opgørelse for hver fleet-kunde baseret på omsætning og kommission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2 items-center">
            <Label>Måned:</Label>
            <Input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{width: 140}} />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunde</TableHead>
                <TableHead className="text-right">Omsætning</TableHead>
                <TableHead className="text-right">Kommission</TableHead>
                <TableHead className="text-right">Udbetaling</TableHead>
                <TableHead className="text-right">Antal bookinger</TableHead>
                <TableHead className="text-right">Handling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map(customer => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {customer.company_name || customer.full_name || customer.email}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.totalDebt)} kr
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.fleet_commission_rate || 0)} kr
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(customer.totalDebt - (customer.fleet_commission_rate || 0))} kr
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.activeLoans.length}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => calculateStatement(customer.id, customer.fleet_commission_rate || 0)} disabled={isCalculating}>
                      Beregn opgørelse
                    </Button>
                  </TableCell>
                      {/* Loans Table: Add marker for platform fee paid */}
                      <Card className="mt-8">
                        <CardHeader>
                          <CardTitle>Aktive Lån og Gebyrer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Kunde</TableHead>
                                <TableHead>Beskrivelse</TableHead>
                                <TableHead>Oprettelsesgebyr</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Handling</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {customers.flatMap(customer => customer.activeLoans.map(loan => (
                                <TableRow key={loan.id}>
                                  <TableCell>{customer.company_name || customer.full_name || customer.email}</TableCell>
                                  <TableCell>{loan.description}</TableCell>
                                  <TableCell>{loan.setup_fee} kr</TableCell>
                                  <TableCell>{loan.platform_fee_paid_at ? <Badge variant="default">Betalt</Badge> : <Badge variant="outline">Ikke betalt</Badge>}</TableCell>
                                  <TableCell>
                                    {!loan.platform_fee_paid_at && (
                                      <Button size="sm" variant="default" onClick={() => handleMarkFeePaid(loan.id)}>
                                        Marker som betalt
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              )))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {statement && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Månedlig opgørelse</CardTitle>
              </CardHeader>
              <CardContent>
                {statement.error ? (
                  <div className="text-destructive">{statement.error}</div>
                ) : (
                  <div>
                    <div>Omsætning: <b>{statement.totalRevenue} kr</b></div>
                    <div>Kommission: <b>{statement.commission} kr</b></div>
                    <div>Udbetaling: <b>{statement.payout} kr</b></div>
                    <div>Antal bookinger: <b>{statement.count}</b></div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" variant="outline" onClick={downloadStatementPDF}>Download PDF</Button>
                      <Button size="sm" variant="default" onClick={createInvoice}>Opret faktura</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
