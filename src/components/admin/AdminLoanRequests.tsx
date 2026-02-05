import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Wallet, MoreHorizontal, CheckCircle, XCircle, 
  Clock, AlertTriangle, Calculator, FileText, Sparkles,
  Download, ExternalLink, Upload, File, X, Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { useRef } from 'react';

interface LoanRequest {
  id: string;
  lessor_id: string;
  vehicle_id: string | null;
  requested_amount: number;
  workshop_name: string | null;
  invoice_url: string | null;
  invoice_filename: string | null;
  description: string;
  suggested_monthly_installment: number | null;
  suggested_months: number | null;
  ai_analysis: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  lessor?: {
    company_name: string | null;
    full_name: string | null;
    email: string;
    fleet_contract_months: number | null;
  };
  vehicle?: {
    make: string;
    model: string;
    registration: string;
  };
}

interface CategoryCap {
  id: string;
  category: string;
  max_amount: number;
  description: string | null;
}

export const AdminLoanRequests = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [requests, setRequests] = useState<LoanRequest[]>([]);
  const [categoryCaps, setCategoryCaps] = useState<CategoryCap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LoanRequest | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showCapsDialog, setShowCapsDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalculatingAI, setIsCalculatingAI] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedInvoice, setUploadedInvoice] = useState<{ name: string; path: string } | null>(null);

  const [reviewForm, setReviewForm] = useState({
    suggested_monthly_installment: '',
    suggested_months: '',
    admin_notes: '',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [requestsResult, capsResult] = await Promise.all([
        supabase
          .from('fleet_loan_requests')
          .select(`
            *,
            lessor:profiles!fleet_loan_requests_lessor_id_fkey(company_name, full_name, email, fleet_contract_months),
            vehicle:vehicles(make, model, registration)
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('fleet_category_caps')
          .select('*')
          .order('category'),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (capsResult.error) throw capsResult.error;

      setRequests((requestsResult.data || []) as unknown as LoanRequest[]);
      setCategoryCaps(capsResult.data || []);
    } catch (error) {
      console.error('Error fetching loan data:', error);
      toast.error('Kunne ikke hente lånedata');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateAISuggestion = async (request: LoanRequest) => {
    setIsCalculatingAI(true);
    try {
      // Calculate based on remaining contract months
      const contractMonths = request.lessor?.fleet_contract_months || 12;
      const remainingMonths = Math.max(3, contractMonths); // At least 3 months
      const setupFee = 300;
      const totalWithFee = request.requested_amount + setupFee;
      const monthlyInstallment = Math.ceil(totalWithFee / remainingMonths);

      setReviewForm(prev => ({
        ...prev,
        suggested_monthly_installment: monthlyInstallment.toString(),
        suggested_months: remainingMonths.toString(),
      }));

      // Mock AI analysis
      const aiAnalysis = `Anbefaling baseret på kontraktperiode (${contractMonths} mdr.): 
Beløb ${request.requested_amount.toLocaleString('da-DK')} kr + 300 kr gebyr = ${totalWithFee.toLocaleString('da-DK')} kr
Afdrag: ${monthlyInstallment.toLocaleString('da-DK')} kr/mdr over ${remainingMonths} måneder.`;

      toast.success('AI-beregning udført');
      return aiAnalysis;
    } catch (error) {
      console.error('Error calculating AI suggestion:', error);
      toast.error('Kunne ikke beregne forslag');
      return null;
    } finally {
      setIsCalculatingAI(false);
    }
  };

  const handleReviewRequest = async (action: 'approve' | 'reject') => {
    if (!selectedRequest || !user) return;

    // Validate minimum amount (500 kr)
    if (action === 'approve' && selectedRequest.requested_amount < 500) {
      toast.error('Lånebeløb skal være minimum 500 kr');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: Record<string, unknown> = {
        status: action === 'approve' ? 'approved' : 'rejected',
        admin_notes: reviewForm.admin_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      };

      if (action === 'approve') {
        updateData.suggested_monthly_installment = parseFloat(reviewForm.suggested_monthly_installment) || null;
        updateData.suggested_months = parseInt(reviewForm.suggested_months) || null;

        // If approved, create the actual loan
        if (reviewForm.suggested_monthly_installment && reviewForm.suggested_months) {
          const { error: loanError } = await supabase.from('fleet_vehicle_loans').insert({
            vehicle_id: selectedRequest.vehicle_id,
            lessor_id: selectedRequest.lessor_id,
            description: selectedRequest.description,
            original_amount: selectedRequest.requested_amount,
            remaining_balance: selectedRequest.requested_amount,
            monthly_installment: parseFloat(reviewForm.suggested_monthly_installment),
            setup_fee: 300,
            remaining_months: parseInt(reviewForm.suggested_months),
            start_date: new Date().toISOString().split('T')[0],
            status: 'active',
          });

          if (loanError) throw loanError;
        }
      }

      const { error } = await supabase
        .from('fleet_loan_requests')
        .update(updateData)
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast.success(action === 'approve' ? 'Lån godkendt og oprettet!' : 'Anmodning afvist');
      setShowReviewDialog(false);
      setSelectedRequest(null);
      setReviewForm({ suggested_monthly_installment: '', suggested_months: '', admin_notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error reviewing request:', error);
      toast.error('Kunne ikke behandle anmodning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCap = async (id: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from('fleet_category_caps')
        .update({ max_amount: newAmount })
        .eq('id', id);

      if (error) throw error;

      toast.success('Grænse opdateret');
      fetchData();
    } catch (error) {
      console.error('Error updating cap:', error);
      toast.error('Kunne ikke opdatere grænse');
    }
  };

  const openReviewDialog = async (request: LoanRequest) => {
    setSelectedRequest(request);
    setReviewForm({
      suggested_monthly_installment: request.suggested_monthly_installment?.toString() || '',
      suggested_months: request.suggested_months?.toString() || '',
      admin_notes: request.admin_notes || '',
    });
    // Pre-populate uploaded invoice if exists
    if (request.invoice_url && request.invoice_filename) {
      setUploadedInvoice({ name: request.invoice_filename, path: request.invoice_url });
    } else {
      setUploadedInvoice(null);
    }
    setShowReviewDialog(true);
  };

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRequest) return;

    if (file.type !== 'application/pdf') {
      toast.error('Kun PDF-filer er tilladt');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen må maks være 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${selectedRequest.lessor_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('workshop-invoices')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update the request with the invoice URL
      const { error: updateError } = await supabase
        .from('fleet_loan_requests')
        .update({ 
          invoice_url: filePath,
          invoice_filename: file.name 
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      setUploadedInvoice({ name: file.name, path: filePath });
      toast.success('Faktura uploadet');
      fetchData();
    } catch (error) {
      console.error('Error uploading invoice:', error);
      toast.error('Kunne ikke uploade faktura');
    } finally {
      setIsUploading(false);
    }
  };

  const removeInvoice = async () => {
    if (!uploadedInvoice || !selectedRequest) return;

    try {
      await supabase.storage
        .from('workshop-invoices')
        .remove([uploadedInvoice.path]);

      await supabase
        .from('fleet_loan_requests')
        .update({ invoice_url: null, invoice_filename: null })
        .eq('id', selectedRequest.id);

      setUploadedInvoice(null);
      toast.success('Faktura fjernet');
      fetchData();
    } catch (error) {
      console.error('Error removing invoice:', error);
      toast.error('Kunne ikke fjerne faktura');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleDownloadInvoice = async (request: LoanRequest) => {
    if (!request.invoice_url) {
      toast.error('Ingen faktura tilgængelig');
      return;
    }

    try {
      const { data, error } = await supabase.storage
        .from('workshop-invoices')
        .createSignedUrl(request.invoice_url, 3600);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Kunne ikke hente faktura');
    }
  };

  const totalPendingAmount = requests
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.requested_amount, 0);

  const totalApprovedAmount = requests
    .filter(r => r.status === 'approved')
    .reduce((sum, r) => sum + r.requested_amount, 0);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Låne-administration
              </CardTitle>
              <CardDescription>
                Godkendelsesflow og risiko-overblik for finansieringsanmodninger
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Clock className="w-3 h-3" />
                {requests.filter(r => r.status === 'pending').length} afventer
              </Badge>
              <Badge variant="secondary" className="gap-1">
                {formatCurrency(totalPendingAmount)} kr anmodet
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setShowCapsDialog(true)}>
                Category Caps
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Risk Overview Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-accent/50 border-accent">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-accent-foreground" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalPendingAmount)} kr</p>
                    <p className="text-sm text-muted-foreground">Afventer godkendelse</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-mint/10 border-mint/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-mint" />
                  <div>
                    <p className="text-2xl font-bold">{formatCurrency(totalApprovedAmount)} kr</p>
                    <p className="text-sm text-muted-foreground">Godkendt i alt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-primary/10 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{requests.length}</p>
                    <p className="text-sm text-muted-foreground">Anmodninger i alt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Henter anmodninger...
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Ingen finansieringsanmodninger</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Udlejer</TableHead>
                  <TableHead>Køretøj</TableHead>
                  <TableHead>Beløb</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                  <TableHead>Dato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {request.lessor?.company_name || request.lessor?.full_name || 'Ukendt'}
                        </p>
                        <p className="text-sm text-muted-foreground">{request.lessor?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {request.vehicle ? (
                        <div>
                          <p>{request.vehicle.make} {request.vehicle.model}</p>
                          <Badge variant="outline" className="text-xs">
                            {request.vehicle.registration}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{formatCurrency(request.requested_amount)} kr</span>
                        {request.workshop_name && (
                          <p className="text-xs text-muted-foreground">{request.workshop_name}</p>
                        )}
                        {request.invoice_url && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs gap-1"
                            onClick={() => handleDownloadInvoice(request)}
                          >
                            <Download className="w-3 h-3" />
                            Faktura
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="truncate text-sm">{request.description}</p>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'd. MMM yyyy', { locale: da })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          request.status === 'approved' ? 'default' :
                          request.status === 'rejected' ? 'destructive' :
                          request.status === 'pending' ? 'outline' : 'secondary'
                        }
                      >
                        {request.status === 'pending' ? 'Afventer' :
                         request.status === 'approved' ? 'Godkendt' :
                         request.status === 'rejected' ? 'Afvist' : 'Annulleret'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' && (
                        <Button 
                          size="sm" 
                          onClick={() => openReviewDialog(request)}
                        >
                          Behandl
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Behandl finansieringsanmodning</DialogTitle>
            <DialogDescription>
              Gennemgå og godkend eller afvis anmodningen
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Request Info */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Udlejer:</span>
                  <span className="font-medium">
                    {selectedRequest.lessor?.company_name || selectedRequest.lessor?.full_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Anmodet beløb:</span>
                  <span className="font-medium">{formatCurrency(selectedRequest.requested_amount)} kr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kontraktperiode:</span>
                  <span className="font-medium">{selectedRequest.lessor?.fleet_contract_months || 12} måneder</span>
                </div>
                {/* Invoice Upload Section */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground text-sm">Værkstedsfaktura (PDF):</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleInvoiceUpload}
                  />
                  
                  {uploadedInvoice ? (
                    <div className="flex items-center justify-between mt-2 p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-primary" />
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => handleDownloadInvoice(selectedRequest)}
                        >
                          {uploadedInvoice.name}
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeInvoice}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploader...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          Upload faktura
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Beskrivelse:</span>
                  <p className="mt-1 text-sm">{selectedRequest.description}</p>
                </div>
              </div>

              {/* AI Calculation */}
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => calculateAISuggestion(selectedRequest)}
                disabled={isCalculatingAI}
              >
                <Sparkles className="w-4 h-4" />
                {isCalculatingAI ? 'Beregner...' : 'Beregn afdragsforslag med AI'}
              </Button>

              {/* Suggested Terms */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Månedligt afdrag</Label>
                  <Input
                    type="number"
                    placeholder="F.eks. 500"
                    value={reviewForm.suggested_monthly_installment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, suggested_monthly_installment: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Antal måneder</Label>
                  <Input
                    type="number"
                    placeholder="F.eks. 12"
                    value={reviewForm.suggested_months}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, suggested_months: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin noter</Label>
                <Textarea
                  placeholder="Evt. bemærkninger til behandlingen..."
                  value={reviewForm.admin_notes}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowReviewDialog(false)}
            >
              Annuller
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleReviewRequest('reject')}
              disabled={isSubmitting}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Afvis
            </Button>
            <Button
              onClick={() => handleReviewRequest('approve')}
              disabled={isSubmitting || !reviewForm.suggested_monthly_installment || !reviewForm.suggested_months}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Godkend & Opret lån
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Caps Dialog */}
      <Dialog open={showCapsDialog} onOpenChange={setShowCapsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Category Caps</DialogTitle>
            <DialogDescription>
              Juster maksimalt lånebeløb pr. køretøjskategori
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {categoryCaps.map((cap) => (
              <div key={cap.id} className="flex items-center justify-between gap-4 p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium capitalize">{cap.category}</p>
                  <p className="text-xs text-muted-foreground">{cap.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-28"
                    defaultValue={cap.max_amount}
                    onBlur={(e) => {
                      const newValue = parseFloat(e.target.value);
                      if (newValue !== cap.max_amount) {
                        handleUpdateCap(cap.id, newValue);
                      }
                    }}
                  />
                  <span className="text-sm text-muted-foreground">kr</span>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCapsDialog(false)}>
              Luk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
