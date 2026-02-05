import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { FleetVehicleStats } from '@/hooks/useFleetPremiumVehicles';
import { 
  Car, TrendingUp, Wallet, MapPin, Wrench, Gauge, Sparkles,
  ChevronDown, ChevronUp, Calendar, CreditCard, CheckCircle2,
  Navigation, CircleDot, Snowflake, Sun, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FleetPremiumVehicleCardProps {
  vehicle: FleetVehicleStats;
}

export const FleetPremiumVehicleCard = ({ vehicle }: FleetPremiumVehicleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusConfig = {
    rented: { label: 'Udlejet', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Car },
    available: { label: 'Klar til udlejning', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: CheckCircle2 },
    maintenance: { label: 'Værksted', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: Wrench },
    cleaning: { label: 'Klargøring', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Sparkles },
  };

  const status = statusConfig[vehicle.currentStatus];
  const StatusIcon = status.icon;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('da-DK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getTireIcon = (type: string | undefined) => {
    if (type === 'winter') return <Snowflake className="w-3.5 h-3.5" />;
    if (type === 'summer') return <Sun className="w-3.5 h-3.5" />;
    return <CircleDot className="w-3.5 h-3.5" />;
  };

  return (
    <Card className="overflow-hidden border-border/50 hover:shadow-lg transition-all">
      {/* Header with image and status */}
      <div className="relative">
        {vehicle.image_url ? (
          <img 
            src={vehicle.image_url} 
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-32 object-cover"
          />
        ) : (
          <div className="w-full h-32 bg-muted flex items-center justify-center">
            <Car className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        <Badge className={cn('absolute top-3 right-3 flex items-center gap-1', status.color)}>
          <StatusIcon className="w-3 h-3" />
          {status.label}
        </Badge>
        {vehicle.location && (
          <Badge className="absolute top-3 left-3 bg-background/80 text-foreground border-border">
            <MapPin className="w-3 h-3 mr-1" />
            GPS
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        {/* Stamdata */}
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg font-bold">
              {vehicle.make} {vehicle.model} {vehicle.variant && <span className="text-muted-foreground font-normal text-sm">({vehicle.variant})</span>}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-mono">
              {vehicle.registration}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            {vehicle.year && <p>{vehicle.year}</p>}
            {vehicle.current_odometer && (
              <p className="flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                {vehicle.current_odometer.toLocaleString('da-DK')} km
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current booking info */}
        {vehicle.currentBooking && (
          <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <Calendar className="w-4 h-4" />
              <span className="font-medium">
                {vehicle.currentBooking.renter_name || 'Anonym lejer'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(vehicle.currentBooking.start_date), 'd. MMM', { locale: da })} - {format(new Date(vehicle.currentBooking.end_date), 'd. MMM yyyy', { locale: da })}
            </p>
          </div>
        )}

        {/* Økonomi-oversigt */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Brutto lejeindtægt</span>
            <span className="font-medium">{formatCurrency(vehicle.monthlyGrossRevenue)} kr</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">LEJIO kommission ({Math.round(vehicle.commissionRate * 100)}%)</span>
            <span className="font-medium text-destructive">-{formatCurrency(vehicle.lejioCommissionAmount)} kr</span>
          </div>
          {vehicle.cleaningFees > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rengøringsgebyr</span>
              <span className="font-medium">+{formatCurrency(vehicle.cleaningFees)} kr</span>
            </div>
          )}
          {vehicle.monthlyInstallment > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Månedligt afdrag</span>
              <span className="font-medium text-amber-600">-{formatCurrency(vehicle.monthlyInstallment)} kr</span>
            </div>
          )}
          <div className="pt-2 border-t border-border flex justify-between">
            <span className="font-medium">Netto-udbetaling</span>
            <span className="font-bold text-lg text-primary">{formatCurrency(vehicle.netPayout)} kr</span>
          </div>
        </div>

        {/* Loan/Afdrag warning */}
        {vehicle.activeLoan && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">{vehicle.activeLoan.description}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">Restgæld</span>
                <p className="font-medium">{formatCurrency(vehicle.activeLoan.remaining_balance)} kr</p>
              </div>
              <div>
                <span className="text-muted-foreground">Restløbetid</span>
                <p className="font-medium">{vehicle.activeLoan.remaining_months} mdr</p>
              </div>
            </div>
          </div>
        )}

        {/* Garantitæller (10-måneders reglen) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">10-måneders garanti</span>
            <span className={cn('font-medium', vehicle.isGuaranteeMet ? 'text-green-600' : 'text-foreground')}>
              {Math.round(vehicle.guaranteePercentage)}%
            </span>
          </div>
          <Progress 
            value={vehicle.guaranteePercentage} 
            className={cn('h-3', vehicle.isGuaranteeMet && '[&>div]:bg-green-500')}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Udlejet: {vehicle.daysRentedThisYear} dage</span>
            <span>Tilgængelig: {vehicle.daysAvailableThisYear} dage</span>
            <span>Mål: {vehicle.guaranteeDays} dage</span>
          </div>
          {vehicle.isGuaranteeMet && (
            <div className="flex items-center gap-1.5 text-xs text-green-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Garanti opfyldt!</span>
            </div>
          )}
        </div>

        {/* Expandable details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Skjul detaljer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Vis flere detaljer
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            {/* GPS Location */}
            {vehicle.location && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Lokation
                </h4>
                <div className="p-3 bg-muted/30 rounded-lg text-sm">
                  <p className="font-mono text-xs">
                    {vehicle.location.latitude.toFixed(6)}, {vehicle.location.longitude.toFixed(6)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Opdateret: {format(new Date(vehicle.location.last_updated), 'd. MMM HH:mm', { locale: da })}
                  </p>
                </div>
              </div>
            )}

            {/* Tire Status */}
            {vehicle.tireStatus && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  {getTireIcon(vehicle.tireStatus.tire_type)}
                  Dæk-status
                </h4>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{vehicle.tireStatus.tire_type === 'winter' ? 'Vinterdæk' : vehicle.tireStatus.tire_type === 'summer' ? 'Sommerdæk' : 'Helårsdæk'}</span>
                    <Badge variant="outline" className="text-xs">Monteret</Badge>
                  </div>
                  {vehicle.tireStatus.brand && (
                    <p className="text-xs text-muted-foreground mt-1">{vehicle.tireStatus.brand}</p>
                  )}
                  {vehicle.tireStatus.tread_depth_mm && (
                    <p className="text-xs text-muted-foreground">
                      Mønsterdybde: {vehicle.tireStatus.tread_depth_mm} mm
                      {vehicle.tireStatus.tread_depth_mm < 3 && (
                        <span className="text-amber-600 ml-1">(Bør skiftes snart)</span>
                      )}
                    </p>
                  )}
                  {vehicle.tireStatus.storage_location && (
                    <p className="text-xs text-muted-foreground">
                      Opbevaring: {vehicle.tireStatus.storage_location}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Next Service */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                Næste service
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground text-xs">Dato</span>
                  <p className="font-medium">
                    {vehicle.nextServiceDate 
                      ? format(new Date(vehicle.nextServiceDate), 'd. MMM yyyy', { locale: da })
                      : 'Ikke planlagt'
                    }
                  </p>
                </div>
                <div className="p-2 bg-muted/30 rounded">
                  <span className="text-muted-foreground text-xs">Kilometer</span>
                  <p className="font-medium">
                    {vehicle.nextServiceKm 
                      ? `${vehicle.nextServiceKm.toLocaleString('da-DK')} km`
                      : 'Ukendt'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Service log */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Seneste service
              </h4>
              {vehicle.lastServiceLog ? (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{vehicle.lastServiceLog.service_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(vehicle.lastServiceLog.service_date), 'd. MMM yyyy', { locale: da })}
                    </span>
                  </div>
                  {vehicle.lastServiceLog.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {vehicle.lastServiceLog.description}
                    </p>
                  )}
                  {vehicle.lastServiceLog.cost && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Pris: {formatCurrency(vehicle.lastServiceLog.cost)} kr
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ingen service registreret endnu</p>
              )}
            </div>

            {/* Yearly economics */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary" />
                Årsoversigt {new Date().getFullYear()}
              </h4>
              <div className="p-3 bg-muted/30 rounded-lg text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total omsætning</span>
                  <span className="font-medium">{formatCurrency(vehicle.yearlyGrossRevenue)} kr</span>
                </div>
              </div>
            </div>

            {/* Loan payment history */}
            {vehicle.loanPaymentHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Betalingshistorik
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {vehicle.loanPaymentHistory.slice(0, 5).map(payment => (
                    <div key={payment.id} className="flex justify-between text-xs p-2 bg-muted/30 rounded">
                      <span>
                        {format(new Date(payment.payment_date), 'd. MMM yyyy', { locale: da })}
                        {payment.payment_type === 'setup_fee' && ' (Oprettelsesgebyr)'}
                      </span>
                      <span className="font-medium">{formatCurrency(payment.amount)} kr</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};
