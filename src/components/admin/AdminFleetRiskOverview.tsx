import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, AlertTriangle, Wallet, 
  Users, Car, DollarSign, ShieldAlert
} from 'lucide-react';
import { supabase } from '@/integrations/azure/client';
import { cn } from '@/lib/utils';

interface RiskData {
  totalActiveLoanBalance: number;
  totalPendingRequests: number;
  pendingRequestsAmount: number;
  totalShortfalls: number;
  shortfallAmount: number;
  customersWithLoans: number;
  vehiclesWithLoans: number;
  averageLoanPerVehicle: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export const AdminFleetRiskOverview = () => {
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRiskData = async () => {
    setIsLoading(true);
    try {
      const [loansResult, requestsResult, shortfallsResult] = await Promise.all([
        supabase
          .from('fleet_vehicle_loans')
          .select('*')
          .eq('status', 'active'),
        supabase
          .from('fleet_loan_requests')
          .select('*')
          .eq('status', 'pending'),
        supabase
          .from('fleet_coverage_shortfalls')
          .select('*')
          .eq('status', 'pending'),
      ]);

      const loans = loansResult.data || [];
      const requests = requestsResult.data || [];
      const shortfalls = shortfallsResult.data || [];

      const totalActiveLoanBalance = loans.reduce((sum, l) => sum + (l.remaining_balance || 0), 0);
      const pendingRequestsAmount = requests.reduce((sum, r) => sum + (r.requested_amount || 0), 0);
      const shortfallAmount = shortfalls.reduce((sum, s) => sum + (s.shortfall_amount || 0), 0);

      const uniqueLessors = new Set(loans.map(l => l.lessor_id));
      const uniqueVehicles = new Set(loans.map(l => l.vehicle_id));

      const averageLoanPerVehicle = uniqueVehicles.size > 0 
        ? totalActiveLoanBalance / uniqueVehicles.size 
        : 0;

      // Calculate risk level based on various factors
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (shortfalls.length > 5 || shortfallAmount > 10000 || totalActiveLoanBalance > 100000) {
        riskLevel = 'high';
      } else if (shortfalls.length > 2 || shortfallAmount > 5000 || totalActiveLoanBalance > 50000) {
        riskLevel = 'medium';
      }

      setRiskData({
        totalActiveLoanBalance,
        totalPendingRequests: requests.length,
        pendingRequestsAmount,
        totalShortfalls: shortfalls.length,
        shortfallAmount,
        customersWithLoans: uniqueLessors.size,
        vehiclesWithLoans: uniqueVehicles.size,
        averageLoanPerVehicle,
        riskLevel,
      });
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-mint bg-mint/10';
      case 'medium': return 'text-amber-500 bg-amber-500/10';
      case 'high': return 'text-destructive bg-destructive/10';
    }
  };

  const getRiskProgress = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 25;
      case 'medium': return 60;
      case 'high': return 90;
    }
  };

  if (isLoading || !riskData) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Henter risiko-overblik...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Risiko-overblik
          </div>
          <Badge 
            className={cn("gap-1", getRiskColor(riskData.riskLevel))}
            variant="outline"
          >
            {riskData.riskLevel === 'low' ? 'Lav risiko' : 
             riskData.riskLevel === 'medium' ? 'Moderat risiko' : 'Høj risiko'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Samlet risikoniveau</span>
            <span className="font-medium capitalize">{riskData.riskLevel}</span>
          </div>
          <Progress 
            value={getRiskProgress(riskData.riskLevel)} 
            className={cn(
              "h-3",
              riskData.riskLevel === 'high' && "[&>div]:bg-destructive",
              riskData.riskLevel === 'medium' && "[&>div]:bg-amber-500",
              riskData.riskLevel === 'low' && "[&>div]:bg-mint"
            )}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Wallet className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xl font-bold">{formatCurrency(riskData.totalActiveLoanBalance)} kr</p>
            <p className="text-xs text-muted-foreground">Samlet lånegæld</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-2 text-secondary-foreground" />
            <p className="text-xl font-bold">{riskData.customersWithLoans}</p>
            <p className="text-xs text-muted-foreground">Kunder med lån</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <Car className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-xl font-bold">{riskData.vehiclesWithLoans}</p>
            <p className="text-xs text-muted-foreground">Biler med lån</p>
          </div>
          
          <div className="bg-muted/50 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 mx-auto mb-2 text-mint" />
            <p className="text-xl font-bold">{formatCurrency(riskData.averageLoanPerVehicle)} kr</p>
            <p className="text-xs text-muted-foreground">Gns. lån pr. bil</p>
          </div>
        </div>

        {/* Warning Cards */}
        {(riskData.totalShortfalls > 0 || riskData.totalPendingRequests > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {riskData.totalShortfalls > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                  <span className="font-medium">Dækningsmangler</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(riskData.shortfallAmount)} kr</p>
                <p className="text-xs text-muted-foreground">{riskData.totalShortfalls} udestående</p>
              </div>
            )}
            
            {riskData.totalPendingRequests > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Afventer godkendelse</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(riskData.pendingRequestsAmount)} kr</p>
                <p className="text-xs text-muted-foreground">{riskData.totalPendingRequests} anmodninger</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
