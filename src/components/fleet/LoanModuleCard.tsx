import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Wallet, CreditCard, FileText, Plus, 
  AlertTriangle, CheckCircle, Clock, TrendingDown
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { FleetVehicleLoan, LoanPayment } from '@/hooks/useFleetPremiumVehicles';

interface LoanModuleCardProps {
  totalLoanBalance: number;
  monthlyInstallment: number;
  activeLoan: FleetVehicleLoan | null;
  loanPaymentHistory: LoanPayment[];
  vehicles: { id: string; registration: string; make: string; model: string }[];
  onRefresh?: () => void;
}

export const LoanModuleCard = ({
  totalLoanBalance,
  monthlyInstallment,
  activeLoan,
  loanPaymentHistory,
  vehicles,
  onRefresh,
}: LoanModuleCardProps) => {
  const { user } = useAuth();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestForm, setRequestForm] = useState({
    vehicle_id: '',
    requested_amount: '',
    workshop_name: '',
    description: '',
  });

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const handleSubmitRequest = async () => {
    if (!user || !requestForm.requested_amount || !requestForm.description) {
      toast.error('Udfyld venligst beløb og beskrivelse');
      return;
    }

    const amount = parseFloat(requestForm.requested_amount);
    if (amount < 500) {
      toast.error('Beløb skal være minimum 500 kr');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('fleet_loan_requests').insert({
        lessor_id: user.id,
        vehicle_id: requestForm.vehicle_id || null,
        requested_amount: parseFloat(requestForm.requested_amount),
        workshop_name: requestForm.workshop_name || null,
        description: requestForm.description,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Finansieringsanmodning sendt!');
      setShowRequestDialog(false);
      setRequestForm({
        vehicle_id: '',
        requested_amount: '',
        workshop_name: '',
        description: '',
      });
      onRefresh?.();
    } catch (error) {
      console.error('Error submitting loan request:', error);
      toast.error('Kunne ikke sende anmodning');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate loan progress
  const loanProgress = activeLoan 
    ? ((activeLoan.original_amount - activeLoan.remaining_balance) / activeLoan.original_amount) * 100 
    : 0;

  return (
    <>
      <Card className="bg-card rounded-2xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Mit Lån
            </div>
            <Button 
              size="sm" 
              onClick={() => setShowRequestDialog(true)}
              className="gap-1"
            >
              <Plus className="w-4 h-4" />
              Anmod om finansiering
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <TrendingDown className="w-5 h-5 mx-auto mb-2 text-destructive" />
              <p className="text-2xl font-bold">{formatCurrency(totalLoanBalance)} kr</p>
              <p className="text-xs text-muted-foreground">Restgæld</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <CreditCard className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{formatCurrency(monthlyInstallment)} kr</p>
              <p className="text-xs text-muted-foreground">Næste afdrag</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <Clock className="w-5 h-5 mx-auto mb-2 text-accent" />
              <p className="text-2xl font-bold">{activeLoan?.remaining_months || 0}</p>
              <p className="text-xs text-muted-foreground">Mdr. tilbage</p>
            </div>
          </div>

          {/* Active Loan Details */}
          {activeLoan && (
            <div className="bg-primary/5 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Aktivt lån</span>
                <Badge variant="outline" className="bg-primary/10">
                  {activeLoan.status === 'active' ? 'Aktiv' : activeLoan.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{activeLoan.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tilbagebetalt</span>
                  <span className="font-medium">{Math.round(loanProgress)}%</span>
                </div>
                <Progress value={loanProgress} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Original:</span>
                  <span className="ml-2 font-medium">{formatCurrency(activeLoan.original_amount)} kr</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Startdato:</span>
                  <span className="ml-2 font-medium">
                    {format(new Date(activeLoan.start_date), 'd. MMM yyyy', { locale: da })}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recent Payments */}
          {loanPaymentHistory.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Seneste betalinger</p>
              <div className="space-y-2">
                {loanPaymentHistory.slice(0, 5).map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-mint" />
                      <div>
                        <p className="text-sm">
                          {payment.payment_type === 'installment' ? 'Afdrag' : 
                           payment.payment_type === 'setup_fee' ? 'Oprettelse' : 'Ekstra betaling'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(payment.payment_date), 'd. MMM yyyy', { locale: da })}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">-{formatCurrency(payment.amount)} kr</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Loan State */}
          {!activeLoan && totalLoanBalance === 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Ingen aktive lån</p>
              <p className="text-sm">Anmod om finansiering ved behov for reparationer</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Financing Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Anmod om finansiering
            </DialogTitle>
            <DialogDescription>
              Send en anmodning om finansiering af reparationer eller vedligeholdelse
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Køretøj (valgfrit)</Label>
              <Select 
                value={requestForm.vehicle_id} 
                onValueChange={(v) => setRequestForm(prev => ({ ...prev, vehicle_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vælg køretøj" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Beløb * (minimum 500 kr)</Label>
              <Input
                type="number"
                min="500"
                placeholder="F.eks. 5000"
                value={requestForm.requested_amount}
                onChange={(e) => setRequestForm(prev => ({ ...prev, requested_amount: e.target.value }))}
              />
              {requestForm.requested_amount && parseFloat(requestForm.requested_amount) < 500 && (
                <p className="text-sm text-destructive">Beløb skal være minimum 500 kr</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Værkstedsnavn</Label>
              <Input
                placeholder="F.eks. AutoService ApS"
                value={requestForm.workshop_name}
                onChange={(e) => setRequestForm(prev => ({ ...prev, workshop_name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Beskrivelse *</Label>
              <Textarea
                placeholder="Beskriv hvad finansieringen skal bruges til..."
                value={requestForm.description}
                onChange={(e) => setRequestForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="bg-accent/50 rounded-lg p-3 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-accent-foreground flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                LEJIO gennemgår din anmodning og beregner et forslag til afdrag baseret på din resterende kontraktperiode.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>
              Annuller
            </Button>
            <Button onClick={handleSubmitRequest} disabled={isSubmitting}>
              {isSubmitting ? 'Sender...' : 'Send anmodning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
