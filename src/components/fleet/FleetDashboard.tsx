import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FleetPlanCard } from './FleetPlanCard';
import { FleetPremiumDashboard } from './FleetPremiumDashboard';
import { useFleetPlan, FleetSettlement, FLEET_PLANS } from '@/hooks/useFleetPlan';
import { useAuth } from '@/hooks/useAuth';
import { Building2, TrendingUp, Calendar, Wallet, Loader2, User } from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export const FleetDashboard = () => {
  const { profile } = useAuth();
  const { currentPlan, settlements, isLoading, requestFleetPlan, cancelFleetPlan } = useFleetPlan();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'fleet_private' | 'fleet_basic' | 'fleet_premium' | null>(null);

  const isProfessional = profile?.user_type === 'professionel';
  const isFleetPremium = currentPlan.type === 'fleet_premium';

  const handleSelectPlan = (plan: 'fleet_private' | 'fleet_basic' | 'fleet_premium') => {
    setSelectedPlan(plan);
    setShowConfirmDialog(true);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan) return;
    
    setIsUpdating(true);
    await requestFleetPlan(selectedPlan);
    setIsUpdating(false);
    setShowConfirmDialog(false);
    setSelectedPlan(null);
  };

  const handleCancelPlan = async () => {
    setIsUpdating(true);
    await cancelFleetPlan();
    setIsUpdating(false);
  };

  return (
    <div className="space-y-6">
      {/* Fleet Premium Dashboard for active Fleet Premium users */}
      {isFleetPremium && (
        <FleetPremiumDashboard />
      )}

      {/* Plan Selection for Private Users */}
      {!isProfessional && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Lad LEJIO udleje for dig
            </CardTitle>
            <CardDescription>
              Slip for besværet - vi håndterer alt med udlejning af din bil mod 30% af omsætningen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <FleetPlanCard
                planType="fleet_private"
                isActive={currentPlan.type === 'fleet_private'}
                onSelect={handleSelectPlan}
                isLoading={isUpdating}
              />
            </div>

            {currentPlan.type && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleCancelPlan}
                  disabled={isUpdating}
                  className="text-destructive hover:text-destructive"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Annuller Fleet Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Plan Selection for Professional Users */}
      {isProfessional && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Fleet Management Planer
            </CardTitle>
            <CardDescription>
              Lad LEJIO varetage din biludlejning - vælg den plan der passer til din virksomhed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <FleetPlanCard
                planType="fleet_basic"
                isActive={currentPlan.type === 'fleet_basic'}
                onSelect={handleSelectPlan}
                isLoading={isUpdating}
              />
              <FleetPlanCard
                planType="fleet_premium"
                isActive={currentPlan.type === 'fleet_premium'}
                onSelect={handleSelectPlan}
                isLoading={isUpdating}
              />
            </div>

            {currentPlan.type && (
              <div className="mt-6 pt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={handleCancelPlan}
                  disabled={isUpdating}
                  className="text-destructive hover:text-destructive"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Annuller Fleet Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settlements */}
      {currentPlan.type && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Månedlige opgørelser
            </CardTitle>
            <CardDescription>
              Oversigt over dine fleet-indtægter og udbetalinger
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : settlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Ingen opgørelser endnu</p>
                <p className="text-sm mt-1">Din første opgørelse vises her efter den første måned</p>
              </div>
            ) : (
              <div className="space-y-3">
                {settlements.map((settlement) => (
                  <SettlementRow key={settlement.id} settlement={settlement} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekræft Fleet Plan</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPlan && (
                <>
                  Du er ved at aktivere <strong>{FLEET_PLANS[selectedPlan].name}</strong> med en
                  kommission på <strong>{FLEET_PLANS[selectedPlan].commissionRate}%</strong> af
                  omsætningen.
                  <br /><br />
                  LEJIO vil kontakte dig for at aftale de nærmere detaljer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuller</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPlan} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Bekræft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SettlementRow = ({ settlement }: { settlement: FleetSettlement }) => {
  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600',
    paid: 'bg-green-500/10 text-green-600',
    processing: 'bg-blue-500/10 text-blue-600',
  };

  const statusLabels: Record<string, string> = {
    pending: 'Afventer',
    paid: 'Udbetalt',
    processing: 'Behandles',
  };

  return (
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
      <div className="flex items-center gap-4">
        <Calendar className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">
            {format(new Date(settlement.settlement_month), 'MMMM yyyy', { locale: da })}
          </p>
          <p className="text-sm text-muted-foreground">
            {settlement.bookings_count} bookinger
          </p>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-lg">
          {settlement.net_payout.toLocaleString('da-DK')} kr
        </p>
        <p className="text-xs text-muted-foreground">
          {settlement.total_revenue.toLocaleString('da-DK')} kr - {settlement.commission_amount.toLocaleString('da-DK')} kr
        </p>
      </div>

      <Badge className={statusColors[settlement.status] || ''}>
        {statusLabels[settlement.status] || settlement.status}
      </Badge>
    </div>
  );
};