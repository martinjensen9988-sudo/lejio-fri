import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRevenueLoss, RevenueLossCalculation } from '@/hooks/useRevenueLoss';
import { useVehicles } from '@/hooks/useVehicles';
import { TrendingDown, Calculator, FileText, Send, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';

const statusColors = {
  calculated: 'bg-blue-100 text-blue-800',
  claimed: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  paid: 'bg-emerald-100 text-emerald-800'
};

const statusLabels = {
  calculated: 'Beregnet',
  claimed: 'Indsendt',
  approved: 'Godkendt',
  paid: 'Udbetalt'
};

export const RevenueLossCard = () => {
  const { calculations, isLoading, isCalculating, calculateRevenueLoss, submitClaim } = useRevenueLoss();
  const { vehicles } = useVehicles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_id: '',
    repair_start_date: '',
    repair_end_date: ''
  });

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle_id) return;

    await calculateRevenueLoss(
      formData.vehicle_id,
      undefined,
      undefined,
      formData.repair_start_date || undefined,
      formData.repair_end_date || undefined
    );

    setIsDialogOpen(false);
    setFormData({
      vehicle_id: '',
      repair_start_date: '',
      repair_end_date: ''
    });
  };

  const totalPending = calculations
    .filter(c => c.status === 'calculated' || c.status === 'claimed')
    .reduce((sum, c) => sum + c.total_revenue_loss, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Tab af Indtægt
          </CardTitle>
          <CardDescription>
            Automatisk beregning ved skader
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={isCalculating}>
              {isCalculating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Beregn tab
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Beregn tab af indtægt</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="space-y-2">
                <Label>Køretøj *</Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vælg køretøj" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.make} {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reparation start</Label>
                  <Input
                    type="date"
                    value={formData.repair_start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, repair_start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forventet slut</Label>
                  <Input
                    type="date"
                    value={formData.repair_end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, repair_end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm">
                <p className="font-medium">Sådan beregnes tabet:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>Historisk dagspris × dage ude af drift</li>
                  <li>Justeret for udnyttelsesgrad</li>
                  <li>Baseret på de seneste 20 bookinger</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={!formData.vehicle_id || isCalculating}>
                {isCalculating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Beregner...
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-2" />
                    Beregn tab
                  </>
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {totalPending > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">Afventende krav</p>
            <p className="text-2xl font-bold text-orange-900">
              {totalPending.toLocaleString('da-DK')} kr
            </p>
          </div>
        )}

        {/* Calculations list */}
        {calculations.length > 0 ? (
          <div className="space-y-3">
            {calculations.slice(0, 5).map(calc => (
              <CalculationItem 
                key={calc.id} 
                calculation={calc}
                onSubmitClaim={() => submitClaim(calc.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Ingen beregninger endnu</p>
            <p className="text-sm">Beregn tab når en bil er på værksted</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface CalculationItemProps {
  calculation: RevenueLossCalculation;
  onSubmitClaim: () => void;
}

const CalculationItem: React.FC<CalculationItemProps> = ({ calculation, onSubmitClaim }) => {
  const status = calculation.status as keyof typeof statusColors;

  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-start justify-between">
        <div>
          {calculation.vehicle && (
            <p className="font-medium text-sm">
              {calculation.vehicle.make} {calculation.vehicle.model}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            {calculation.days_out_of_service} dage ude af drift
          </p>
        </div>
        <Badge className={statusColors[status]}>
          {statusLabels[status]}
        </Badge>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Dagspris:</span>
          <span className="ml-1 font-medium">{calculation.daily_rate_average.toLocaleString('da-DK')} kr</span>
        </div>
        <div>
          <span className="text-muted-foreground">Udnyttelse:</span>
          <span className="ml-1 font-medium">{calculation.historical_utilization_rate?.toFixed(0) || 0}%</span>
        </div>
        {calculation.ai_estimated_bookings && (
          <div>
            <span className="text-muted-foreground">Mistede bookinger:</span>
            <span className="ml-1 font-medium">~{calculation.ai_estimated_bookings}</span>
          </div>
        )}
        {calculation.repair_start_date && (
          <div>
            <span className="text-muted-foreground">Periode:</span>
            <span className="ml-1 font-medium">
              {format(new Date(calculation.repair_start_date), 'd/M', { locale: da })} - 
              {calculation.repair_end_date && format(new Date(calculation.repair_end_date), 'd/M', { locale: da })}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-lg font-bold text-red-600">
          -{calculation.total_revenue_loss.toLocaleString('da-DK')} kr
        </p>
        {calculation.status === 'calculated' && (
          <Button size="sm" variant="outline" onClick={onSubmitClaim}>
            <Send className="h-3 w-3 mr-1" />
            Indsend krav
          </Button>
        )}
        {calculation.status === 'claimed' && (
          <Button size="sm" variant="ghost" disabled>
            <FileText className="h-3 w-3 mr-1" />
            Afventer
          </Button>
        )}
      </div>
    </div>
  );
};
